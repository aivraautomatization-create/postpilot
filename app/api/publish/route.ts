import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { isSubscriptionActive, getUsageLimit } from '@/lib/plan-limits';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

export async function POST(req: Request) {
  try {
    const { userId, content, imageUrl, videoUrl, platforms, scheduledDate } = await req.json();

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'No platforms selected' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    // Fetch user profile for subscription check
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check subscription is active
    if (!isSubscriptionActive(profile)) {
      return NextResponse.json({
        error: 'Your trial has expired. Please upgrade to continue publishing.',
        code: 'SUBSCRIPTION_EXPIRED'
      }, { status: 403 });
    }

    // Check usage limits
    const period = getCurrentPeriod();
    const { data: usage } = await supabase
      .from('usage')
      .select('posts_count')
      .eq('user_id', userId)
      .eq('period', period)
      .single();

    const currentUsage = usage?.posts_count || 0;
    const limit = getUsageLimit(profile.subscription_tier);

    if (currentUsage >= limit) {
      return NextResponse.json({
        error: `Monthly post limit reached (${currentUsage}/${limit}). Upgrade your plan for more posts.`,
        code: 'USAGE_LIMIT_REACHED'
      }, { status: 403 });
    }

    // Handle scheduled posts
    if (scheduledDate) {
      const scheduledFor = new Date(scheduledDate);
      if (scheduledFor <= new Date()) {
        return NextResponse.json({ error: 'Scheduled date must be in the future' }, { status: 400 });
      }

      // Insert as scheduled post
      await supabase.from('posts').insert({
        user_id: userId,
        content,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        platforms,
        status: 'scheduled',
        scheduled_for: scheduledDate,
      });

      // Try to send Inngest event if available
      try {
        const { inngest } = await import('@/lib/inngest');
        await inngest.send({
          name: 'post/scheduled',
          data: { userId, content, imageUrl, videoUrl, platforms },
          ts: scheduledFor.getTime(),
        });
      } catch {
        // Inngest not configured — post will remain scheduled for manual processing
      }

      return NextResponse.json({
        success: true,
        results: platforms.map((p: string) => ({
          platform: p,
          status: 'scheduled',
          message: `Scheduled for ${scheduledFor.toLocaleString()}`,
          timestamp: new Date().toISOString(),
        })),
      });
    }

    // Fetch user's connected social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId);

    if (accountsError || !accounts) {
      return NextResponse.json({ error: 'Failed to fetch connected accounts' }, { status: 500 });
    }

    const results: Array<{ platform: string; status: string; message: string; timestamp: string }> = [];

    for (const platform of platforms) {
      const account = accounts.find((a: any) => a.provider === platform);

      if (!account) {
        results.push({
          platform,
          status: 'error',
          message: `Account not connected for ${platform}`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      try {
        if (platform === 'twitter') {
          const client = new TwitterApi(account.access_token);

          if (imageUrl) {
            // Upload image then tweet with media
            try {
              const imageBuffer = await downloadImage(imageUrl);
              const mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/png' });
              await client.v2.tweet({ text: content.substring(0, 280), media: { media_ids: [mediaId] } });
            } catch {
              // Fallback to text-only if image upload fails
              await client.v2.tweet(content.substring(0, 280));
            }
          } else {
            await client.v2.tweet(content.substring(0, 280));
          }

          results.push({
            platform,
            status: 'success',
            message: 'Successfully posted to X (Twitter)',
            timestamp: new Date().toISOString(),
          });
        } else if (platform === 'facebook' || platform === 'instagram') {
          const pageId = account.provider_account_id;

          if (imageUrl) {
            await axios.post(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
              url: imageUrl,
              caption: content,
              access_token: account.access_token,
            });
          } else {
            await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
              message: content,
              access_token: account.access_token,
            });
          }

          results.push({
            platform,
            status: 'success',
            message: `Successfully posted to ${platform}`,
            timestamp: new Date().toISOString(),
          });
        } else if (platform === 'linkedin') {
          // LinkedIn API v2 — UGC Post
          const personUrn = account.provider_account_id;

          if (imageUrl) {
            // Step 1: Register image upload
            const registerResponse = await axios.post(
              'https://api.linkedin.com/v2/assets?action=registerUpload',
              {
                registerUploadRequest: {
                  recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                  owner: `urn:li:person:${personUrn}`,
                  serviceRelationships: [
                    { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
                  ],
                },
              },
              { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } }
            );

            const uploadUrl =
              registerResponse.data.value.uploadMechanism[
                'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
              ].uploadUrl;
            const asset = registerResponse.data.value.asset;

            // Step 2: Upload the image binary
            const imageBuffer = await downloadImage(imageUrl);
            await axios.put(uploadUrl, imageBuffer, {
              headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'image/png' },
            });

            // Step 3: Create post with image
            await axios.post(
              'https://api.linkedin.com/v2/ugcPosts',
              {
                author: `urn:li:person:${personUrn}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                  'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text: content },
                    shareMediaCategory: 'IMAGE',
                    media: [
                      {
                        status: 'READY',
                        media: asset,
                      },
                    ],
                  },
                },
                visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
              },
              { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } }
            );
          } else {
            // Text-only LinkedIn post
            await axios.post(
              'https://api.linkedin.com/v2/ugcPosts',
              {
                author: `urn:li:person:${personUrn}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                  'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text: content },
                    shareMediaCategory: 'NONE',
                  },
                },
                visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
              },
              { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } }
            );
          }

          results.push({
            platform,
            status: 'success',
            message: 'Successfully posted to LinkedIn',
            timestamp: new Date().toISOString(),
          });
        } else if (platform === 'tiktok') {
          // TikTok Content Posting API
          if (!videoUrl && !imageUrl) {
            results.push({
              platform,
              status: 'error',
              message: 'TikTok requires an image or video to publish',
              timestamp: new Date().toISOString(),
            });
            continue;
          }

          if (imageUrl) {
            // TikTok Photo Mode
            const initResponse = await axios.post(
              'https://open.tiktokapis.com/v2/post/publish/content/init/',
              {
                post_info: {
                  title: content.substring(0, 150),
                  privacy_level: 'SELF_ONLY', // Users can change this on TikTok
                },
                source_info: {
                  source: 'PULL_FROM_URL',
                  photo_cover_index: 0,
                  photo_images: [imageUrl],
                },
                post_mode: 'DIRECT_POST',
                media_type: 'PHOTO',
              },
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (initResponse.data.error?.code !== 'ok' && initResponse.data.error?.code) {
              throw new Error(initResponse.data.error.message || 'TikTok publish failed');
            }
          } else if (videoUrl) {
            // TikTok Video Mode — pull from URL
            const initResponse = await axios.post(
              'https://open.tiktokapis.com/v2/post/publish/video/init/',
              {
                post_info: {
                  title: content.substring(0, 150),
                  privacy_level: 'SELF_ONLY',
                },
                source_info: {
                  source: 'PULL_FROM_URL',
                  video_url: videoUrl,
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (initResponse.data.error?.code !== 'ok' && initResponse.data.error?.code) {
              throw new Error(initResponse.data.error.message || 'TikTok video publish failed');
            }
          }

          results.push({
            platform,
            status: 'success',
            message: 'Successfully posted to TikTok',
            timestamp: new Date().toISOString(),
          });
        } else {
          // Unknown platform
          results.push({
            platform,
            status: 'error',
            message: `Publishing to ${platform} is not yet supported`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error(`Error posting to ${platform}:`, err.response?.data || err.message);
        results.push({
          platform,
          status: 'error',
          message: `Failed to post to ${platform}: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Determine overall status
    const hasSuccess = results.some((r) => r.status === 'success');
    const overallStatus = hasSuccess ? 'published' : 'failed';

    // Record the post
    const publishResults: Record<string, { status: string; message: string }> = {};
    for (const r of results) {
      publishResults[r.platform] = { status: r.status, message: r.message };
    }

    await supabase.from('posts').insert({
      user_id: userId,
      content,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      platforms,
      status: overallStatus,
      publish_results: publishResults,
      published_at: hasSuccess ? new Date().toISOString() : null,
    });

    // Update usage count
    if (hasSuccess) {
      const { data: existingUsage } = await supabase
        .from('usage')
        .select('id, posts_count, images_count, videos_count')
        .eq('user_id', userId)
        .eq('period', period)
        .single();

      if (existingUsage) {
        await supabase
          .from('usage')
          .update({
            posts_count: (existingUsage.posts_count || 0) + 1,
            images_count: (existingUsage.images_count || 0) + (imageUrl ? 1 : 0),
            videos_count: (existingUsage.videos_count || 0) + (videoUrl ? 1 : 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUsage.id);
      } else {
        await supabase.from('usage').insert({
          user_id: userId,
          period,
          posts_count: 1,
          images_count: imageUrl ? 1 : 0,
          videos_count: videoUrl ? 1 : 0,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
