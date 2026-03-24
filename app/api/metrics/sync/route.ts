import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { refreshAccessToken } from '@/lib/token-refresh';

/**
 * POST /api/metrics/sync
 * Fetches real engagement metrics from social platforms for all published posts.
 * Upserts results into the `post_metrics` table.
 *
 * Note: This endpoint requires that posts were published with platform_post_id
 * stored in publish_results. Posts without IDs are skipped gracefully.
 */
export async function POST() {
  try {
    // Authenticate user
    const supabaseAuth = await getSupabaseServer();
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    const supabase = getSupabaseAdmin() as any;
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch published posts with their publish_results (which may include platform post IDs)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, platforms, publish_results, published_at')
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (postsError) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ synced: 0, errors: [] });
    }

    // Fetch user's connected social accounts
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ synced: 0, errors: ['No connected social accounts'] });
    }

    let synced = 0;
    const errors: string[] = [];

    for (const post of posts) {
      const platforms: string[] = post.platforms || [];
      const publishResults: Record<string, any> = post.publish_results || {};

      for (const platform of platforms) {
        const account = accounts.find((a: any) => a.provider === platform);
        if (!account) continue;

        // Extract platform post ID from publish_results if available
        const platformResult = publishResults[platform];
        const platformPostId = platformResult?.post_id || platformResult?.id || null;

        try {
          let metrics: {
            likes: number;
            shares: number;
            reach: number;
            impressions: number;
          } | null = null;

          // Try to refresh token before making API calls (skip for facebook/instagram — long-lived tokens)
          let accessToken = account.access_token;
          if (account.refresh_token && platform !== 'facebook' && platform !== 'instagram') {
            const refreshed = await refreshAccessToken(platform, account.refresh_token);
            if (refreshed) {
              accessToken = refreshed.accessToken;
              // Persist updated token
              await supabase
                .from('social_accounts')
                .update({
                  access_token: refreshed.accessToken,
                  refresh_token: refreshed.refreshToken,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', account.id);
            }
          }

          if (platform === 'twitter' && platformPostId) {
            // Twitter v2: GET /2/tweets/:id?tweet.fields=public_metrics
            try {
              const client = new TwitterApi(accessToken);
              const tweet = await client.v2.singleTweet(platformPostId, {
                'tweet.fields': ['public_metrics'],
              });
              const pm = tweet.data.public_metrics;
              if (pm) {
                metrics = {
                  likes: pm.like_count || 0,
                  shares: pm.retweet_count || 0,
                  reach: pm.impression_count || 0,
                  impressions: pm.impression_count || 0,
                };
              }
            } catch (twitterErr: any) {
              errors.push(`Twitter metrics for post ${post.id}: ${twitterErr.message}`);
              continue;
            }
          } else if (platform === 'instagram' && platformPostId) {
            // Meta Graph API: GET /{media-id}/insights
            try {
              const insightsResp = await axios.get(
                `https://graph.facebook.com/v21.0/${platformPostId}/insights`,
                {
                  params: {
                    metric: 'reach,impressions,likes',
                    access_token: accessToken,
                  },
                }
              );
              const insightData: any[] = insightsResp.data.data || [];
              const getValue = (name: string) =>
                insightData.find((m: any) => m.name === name)?.values?.[0]?.value || 0;

              metrics = {
                likes: getValue('likes'),
                shares: 0,
                reach: getValue('reach'),
                impressions: getValue('impressions'),
              };
            } catch (igErr: any) {
              errors.push(`Instagram metrics for post ${post.id}: ${igErr.response?.data?.error?.message || igErr.message}`);
              continue;
            }
          } else if (platform === 'facebook' && platformPostId) {
            // Meta Graph API: GET /{post-id}/insights
            try {
              const fbInsightsResp = await axios.get(
                `https://graph.facebook.com/v21.0/${platformPostId}/insights`,
                {
                  params: {
                    metric: 'post_impressions,post_reactions_like_total,post_clicks',
                    access_token: accessToken,
                  },
                }
              );
              const fbData: any[] = fbInsightsResp.data.data || [];
              const getFbValue = (name: string) =>
                fbData.find((m: any) => m.name === name)?.values?.[0]?.value || 0;

              metrics = {
                likes: getFbValue('post_reactions_like_total'),
                shares: 0,
                reach: getFbValue('post_impressions'),
                impressions: getFbValue('post_impressions'),
              };
            } catch (fbErr: any) {
              errors.push(`Facebook metrics for post ${post.id}: ${fbErr.response?.data?.error?.message || fbErr.message}`);
              continue;
            }
          } else {
            // No platform post ID stored — skip this post/platform combination
            // This is expected until the publish route is updated to store platform post IDs
            continue;
          }

          if (!metrics) continue;

          // Upsert into post_metrics table
          const { error: upsertError } = await supabase
            .from('post_metrics')
            .upsert(
              {
                post_id: post.id,
                platform,
                likes: metrics.likes,
                shares: metrics.shares,
                reach: metrics.reach,
                impressions: metrics.impressions,
                fetched_at: new Date().toISOString(),
              },
              { onConflict: 'post_id,platform' }
            );

          if (upsertError) {
            errors.push(`DB upsert failed for post ${post.id} / ${platform}: ${upsertError.message}`);
          } else {
            synced++;
          }
        } catch (err: any) {
          console.error(`Metrics sync failed for post ${post.id} / ${platform}:`, err.message);
          errors.push(`${platform} post ${post.id}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({ synced, errors });
  } catch (error: any) {
    console.error('Metrics sync error:', error);
    return NextResponse.json({ error: 'Failed to sync metrics' }, { status: 500 });
  }
}
