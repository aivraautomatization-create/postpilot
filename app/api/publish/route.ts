import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/token-refresh';
import { isSubscriptionActive, PLAN_LIMITS } from '@/lib/plan-limits';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimitAsync } from "@/lib/rate-limit-store";
import { sanitizeErrorForClient } from '@/lib/error-messages';
import { publishSchema } from '@/lib/validations';
import { publishToPlatform, type PlatformName } from '@/lib/social-publishers';

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(req: Request) {
  try {
    const { content, imageUrl, videoUrl, platforms, scheduledDate } = await req.json();

    const parsed = publishSchema.safeParse({ content, imageUrl, videoUrl, platforms, scheduledDate });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input. Content and at least one platform are required.' }, { status: 400 });
    }

    // Authenticate via server-side session — never trust client-provided userId
    const supabaseAuth = await getSupabaseServer();
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    // Rate limit: 10 per minute per user
    const { allowed, retryAfter } = await checkRateLimitAsync(`publish:${userId}`, 10, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
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
      .select('posts_count, videos_count')
      .eq('user_id', userId)
      .eq('period', period)
      .single();

    const currentUsagePosts = usage?.posts_count || 0;
    const currentUsageVideos = usage?.videos_count || 0;
    
    // Fallback to entry limits if tier not found; add referral bonus posts
    const tierLimits = PLAN_LIMITS[profile.subscription_tier] || PLAN_LIMITS['tier-entry'];
    const postsLimit = tierLimits.posts + (profile.bonus_posts || 0);
    const videosLimit = tierLimits.videos;

    if (videoUrl) {
      if (currentUsageVideos >= videosLimit) {
        return NextResponse.json({
          error: `Monthly video limit reached (${currentUsageVideos}/${videosLimit}). Upgrade your plan for more Reels/TikToks.`,
          code: 'USAGE_LIMIT_REACHED'
        }, { status: 403 });
      }
    } else {
      if (currentUsagePosts >= postsLimit) {
        return NextResponse.json({
          error: `Monthly post limit reached (${currentUsagePosts}/${postsLimit}). Upgrade your plan for more posts.`,
          code: 'USAGE_LIMIT_REACHED'
        }, { status: 403 });
      }
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
        let currentAccessToken = account.access_token;
        let currentRefreshToken = account.refresh_token;

        const doPublish = (token: string) =>
          publishToPlatform({
            platform: platform as PlatformName,
            token,
            accountId: account.provider_account_id || '',
            content,
            imageUrl,
            videoUrl,
          });

        try {
          await doPublish(currentAccessToken);
        } catch (postError: any) {
          const isUnauthorized = postError.response?.status === 401 || postError.code === 401 || postError.message?.includes('401');

          if (isUnauthorized && currentRefreshToken) {
            const refreshed = await refreshAccessToken(platform, currentRefreshToken);
            if (refreshed) {
              currentAccessToken = refreshed.accessToken;
              currentRefreshToken = refreshed.refreshToken;

              await supabase.from('social_accounts').update({
                access_token: currentAccessToken,
                refresh_token: currentRefreshToken,
                updated_at: new Date().toISOString()
              }).eq('id', account.id);

              await doPublish(currentAccessToken);
            } else {
              throw postError;
            }
          } else {
            throw postError;
          }
        }

        results.push({
          platform,
          status: 'success',
          message: `Successfully posted to ${platform}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error(`Error posting to ${platform}:`, err.response?.data || err.message);
        results.push({
          platform,
          status: 'error',
          message: err.message || `Failed to post to ${platform}. Please try again.`,
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
    return NextResponse.json({ error: sanitizeErrorForClient(error) }, { status: 500 });
  }
}
