import { inngest } from './inngest';
import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { sendTrialWarningEmail, sendWinBackEmail, sendMilestoneEmail, sendDripDay1Email, sendDripDay3Email, sendDripDay7Email } from './emails';
import { publishToPlatform, type PlatformName } from './social-publishers';
import { refreshAccessToken } from './token-refresh';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Scheduled Post Publisher
 * Fires when a scheduled post's time arrives
 */
export const publishScheduledPost = inngest.createFunction(
  { id: 'publish-scheduled-post', name: 'Publish Scheduled Post' },
  { event: 'post/scheduled' },
  async ({ event }) => {
    const { userId, content, imageUrl, videoUrl, platforms, postId } = event.data;

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    // Fetch user's connected social accounts
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId);

    if (!accounts || accounts.length === 0) {
      // Update post as failed
      if (postId) {
        await supabase.from('posts').update({
          status: 'failed',
          publish_results: { error: 'No connected accounts found' },
        }).eq('id', postId);
      }
      return { success: false, error: 'No connected accounts' };
    }

    const results: Record<string, { status: string; message: string }> = {};
    let hasSuccess = false;

    for (const platform of platforms) {
      const account = accounts.find((a: { provider: string; access_token: string; provider_account_id: string }) => a.provider === platform);

      if (!account) {
        results[platform] = { status: 'error', message: `Account not connected for ${platform}` };
        continue;
      }

      try {
        await publishToPlatform({
          platform: platform as PlatformName,
          token: account.access_token,
          accountId: account.provider_account_id,
          content,
          imageUrl,
          videoUrl,
        });
        results[platform] = { status: 'success', message: `Successfully posted to ${platform}` };
        hasSuccess = true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Scheduled publish to ${platform} failed:`, message);
        results[platform] = { status: 'error', message: `Failed: ${message}` };
      }
    }

    // Update the post record
    if (postId) {
      await supabase.from('posts').update({
        status: hasSuccess ? 'published' : 'failed',
        publish_results: results,
        published_at: hasSuccess ? new Date().toISOString() : null,
      }).eq('id', postId);

      if (hasSuccess) {
        await inngest.send({
          name: 'post/published',
          data: { userId, postId },
        });
      }
    }

    // Update usage if any publish succeeded
    if (hasSuccess) {
      const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const { data: existingUsage } = await supabase
        .from('usage')
        .select('id, posts_count, images_count, videos_count')
        .eq('user_id', userId)
        .eq('period', period)
        .single();

      if (existingUsage) {
        await supabase.from('usage').update({
          posts_count: (existingUsage.posts_count || 0) + 1,
          images_count: (existingUsage.images_count || 0) + (imageUrl ? 1 : 0),
          videos_count: (existingUsage.videos_count || 0) + (videoUrl ? 1 : 0),
          updated_at: new Date().toISOString(),
        }).eq('id', existingUsage.id);
      } else {
        await supabase.from('usage').insert({
          user_id: userId, period,
          posts_count: 1,
          images_count: imageUrl ? 1 : 0,
          videos_count: videoUrl ? 1 : 0,
        });
      }
    }

    return { success: hasSuccess, results };
  }
);

/**
 * Trial Warning Cron — runs daily at 9 AM
 * Sends warning emails to users whose trial ends in 2 days
 */
export const trialWarningCron = inngest.createFunction(
  { id: 'trial-warning-cron', name: 'Trial Warning Emails' },
  { cron: '0 9 * * *' },
  async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    // Find users whose trial ends in approximately 2 days
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: trialingUsers } = await supabase
      .from('profiles')
      .select('id, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .gte('trial_ends_at', twoDaysFromNow.toISOString())
      .lt('trial_ends_at', threeDaysFromNow.toISOString());

    if (!trialingUsers || trialingUsers.length === 0) {
      return { sent: 0 };
    }

    let sent = 0;
    for (const user of trialingUsers) {
      // Get the user's email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      if (authUser?.user?.email) {
        const daysLeft = Math.ceil(
          (new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        await sendTrialWarningEmail(authUser.user.email, daysLeft);
        sent++;
      }
    }

    return { sent };
  }
);

export const autoLearnFromPost = inngest.createFunction(
  { id: 'auto-learn-from-post', name: 'Auto-Learn from Published Post' },
  { event: 'post/published' },
  async ({ event }) => {
    const { userId, postId } = event.data;
    const { learnFromPost } = await import('./ai-brain');
    await learnFromPost(userId, postId);
    return { success: true, postId };
  }
);

/**
 * Win-Back Email Cron — runs daily at 10 AM
 * Sends win-back emails to users whose trial expired 3 days ago
 */
export const winBackCron = inngest.createFunction(
  { id: 'win-back-cron', name: 'Win-Back Emails' },
  { cron: '0 10 * * *' },
  async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const { data: expiredUsers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('subscription_status', 'inactive')
      .gte('trial_ends_at', fourDaysAgo.toISOString())
      .lt('trial_ends_at', threeDaysAgo.toISOString());

    if (!expiredUsers || expiredUsers.length === 0) return { sent: 0 };

    let sent = 0;
    for (const user of expiredUsers) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      if (authUser?.user?.email) {
        await sendWinBackEmail(authUser.user.email, user.full_name || undefined);
        sent++;
      }
    }
    return { sent };
  }
);

/**
 * Milestone Celebration — triggered when post count reaches milestones
 */
export const milestoneCheck = inngest.createFunction(
  { id: 'milestone-check', name: 'Milestone Celebration' },
  { event: 'post/milestone' },
  async ({ event }) => {
    const { userId, totalPosts } = event.data;
    const milestones = [10, 25, 50, 100, 250, 500];
    if (!milestones.includes(totalPosts)) return { milestone: false };

    const supabase = getSupabaseAdmin();
    if (!supabase) return { milestone: false };

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (!authUser?.user?.email) return { milestone: false };

    await sendMilestoneEmail(
      authUser.user.email,
      `You've published ${totalPosts} posts!`,
      `That's a huge milestone. You're in the top 5% of Puls users for content consistency.`
    );
    return { milestone: true, count: totalPosts };
  }
);

/**
 * Auto Metric Sync Cron — runs every 6 hours
 *
 * Pulls real engagement metrics from connected social accounts back into
 * post_metrics. After syncing, triggers AI Brain learning on posts with
 * new meaningful engagement (>10 total interactions).
 *
 * This creates the personalization flywheel:
 * Publish → Real metrics arrive → AI Brain learns → Better content next time
 */
export const metricSyncCron = inngest.createFunction(
  { id: 'metric-sync-cron', name: 'Auto Metric Sync' },
  { cron: '0 */6 * * *' },
  async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    // Get all users with at least one published post in last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, user_id, platforms, publish_results, published_at')
      .eq('status', 'published')
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(200);

    if (!recentPosts || recentPosts.length === 0) return { synced: 0 };

    // Group posts by user to batch account lookups
    const userPostMap = new Map<string, typeof recentPosts>();
    for (const post of recentPosts) {
      const userId = post.user_id as string;
      if (!userPostMap.has(userId)) userPostMap.set(userId, []);
      userPostMap.get(userId)!.push(post);
    }

    let synced = 0;
    const postsToLearn: Array<{ userId: string; postId: string }> = [];

    for (const [userId, posts] of userPostMap.entries()) {
      // Fetch user's connected accounts
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId);

      if (!accounts || accounts.length === 0) continue;

      for (const post of posts) {
        const platforms: string[] = (post.platforms as string[]) || [];
        const publishResults: Record<string, any> = (post.publish_results as Record<string, any>) || {};

        for (const platform of platforms) {
          const account = accounts.find((a: any) => a.provider === platform);
          if (!account) continue;

          const platformResult = publishResults[platform];
          const platformPostId = platformResult?.post_id || platformResult?.id || null;
          if (!platformPostId) continue;

          try {
            // Refresh token if needed
            let accessToken = account.access_token;
            if (account.refresh_token && platform !== 'facebook' && platform !== 'instagram') {
              try {
                const refreshed = await refreshAccessToken(platform, account.refresh_token);
                if (refreshed) {
                  accessToken = refreshed.accessToken;
                  await supabase
                    .from('social_accounts')
                    .update({
                      access_token: refreshed.accessToken,
                      refresh_token: refreshed.refreshToken,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', account.id);
                }
              } catch {
                // Token refresh failed — try with existing token
              }
            }

            let metrics: { likes: number; shares: number; reach: number; impressions: number } | null = null;

            if (platform === 'twitter') {
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
            } else if (platform === 'instagram') {
              const resp = await axios.get(
                `https://graph.facebook.com/v21.0/${platformPostId}/insights`,
                { params: { metric: 'reach,impressions,likes', access_token: accessToken } }
              );
              const data: any[] = resp.data.data || [];
              const getValue = (name: string) =>
                data.find((m: any) => m.name === name)?.values?.[0]?.value || 0;
              metrics = {
                likes: getValue('likes'),
                shares: 0,
                reach: getValue('reach'),
                impressions: getValue('impressions'),
              };
            } else if (platform === 'facebook') {
              const resp = await axios.get(
                `https://graph.facebook.com/v21.0/${platformPostId}/insights`,
                { params: { metric: 'post_impressions,post_reactions_like_total,post_clicks', access_token: accessToken } }
              );
              const data: any[] = resp.data.data || [];
              const getValue = (name: string) =>
                data.find((m: any) => m.name === name)?.values?.[0]?.value || 0;
              metrics = {
                likes: getValue('post_reactions_like_total'),
                shares: 0,
                reach: getValue('post_impressions'),
                impressions: getValue('post_impressions'),
              };
            }

            if (!metrics) continue;

            await supabase
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

            synced++;

            // Queue AI Brain learning for posts with meaningful engagement
            const totalEngagement = metrics.likes + metrics.shares;
            if (totalEngagement >= 10) {
              postsToLearn.push({ userId, postId: post.id as string });
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error(`[metric-sync] ${platform} post ${post.id}: ${message}`);
          }
        }
      }
    }

    // Trigger AI Brain learning for high-engagement posts (deduplicated)
    const seen = new Set<string>();
    for (const { userId, postId } of postsToLearn) {
      if (seen.has(postId)) continue;
      seen.add(postId);
      try {
        await inngest.send({
          name: 'post/published',
          data: { userId, postId },
        });
      } catch {
        // Non-critical — learning will happen on next sync
      }
    }

    return { synced, learned: seen.size };
  }
);

/**
 * Onboarding Drip — Day 1 (runs daily at 10 AM)
 * Targets users who signed up ~24h ago and haven't generated any posts yet.
 * Goal: drive the "first post" activation event.
 */
export const dripDay1Cron = inngest.createFunction(
  { id: 'drip-day1', name: 'Onboarding Drip — Day 1' },
  { cron: '0 10 * * *' },
  async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    const now = new Date();
    const from = new Date(now.getTime() - 26 * 60 * 60 * 1000); // 26h ago
    const to = new Date(now.getTime() - 22 * 60 * 60 * 1000);   // 22h ago

    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .eq('onboarding_completed', true);

    if (!users || users.length === 0) return { sent: 0 };

    let sent = 0;
    for (const user of users) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      if (!authUser?.user?.email) continue;
      await sendDripDay1Email(authUser.user.email, user.full_name || undefined);
      sent++;
    }
    return { sent };
  }
);

/**
 * Onboarding Drip — Day 3 (runs daily at 10 AM)
 * Targets users who signed up ~72h ago. Personalises based on posts generated.
 * Goal: get them to connect social accounts + publish.
 */
export const dripDay3Cron = inngest.createFunction(
  { id: 'drip-day3', name: 'Onboarding Drip — Day 3' },
  { cron: '0 10 * * *' },
  async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    const now = new Date();
    const from = new Date(now.getTime() - 74 * 60 * 60 * 1000);
    const to = new Date(now.getTime() - 70 * 60 * 60 * 1000);

    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .eq('onboarding_completed', true);

    if (!users || users.length === 0) return { sent: 0 };

    // Get current month period for usage lookup
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let sent = 0;
    for (const user of users) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      if (!authUser?.user?.email) continue;

      const { data: usage } = await supabase
        .from('usage')
        .select('posts_count')
        .eq('user_id', user.id)
        .eq('period', period)
        .single();

      await sendDripDay3Email(
        authUser.user.email,
        user.full_name || undefined,
        usage?.posts_count || 0
      );
      sent++;
    }
    return { sent };
  }
);

/**
 * Onboarding Drip — Day 7 (runs daily at 10 AM)
 * "Half-trial" checkpoint. Pushes toward upgrade with social proof.
 * Personalises based on posts published (not just generated).
 */
export const dripDay7Cron = inngest.createFunction(
  { id: 'drip-day7', name: 'Onboarding Drip — Day 7' },
  { cron: '0 10 * * *' },
  async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Database connection failed');

    const now = new Date();
    const from = new Date(now.getTime() - 170 * 60 * 60 * 1000);
    const to = new Date(now.getTime() - 166 * 60 * 60 * 1000);

    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .eq('subscription_status', 'trialing'); // Only send to still-trialing users

    if (!users || users.length === 0) return { sent: 0 };

    let sent = 0;
    for (const user of users) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      if (!authUser?.user?.email) continue;

      // Count published posts for personalisation
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published');

      await sendDripDay7Email(
        authUser.user.email,
        user.full_name || undefined,
        count || 0
      );
      sent++;
    }
    return { sent };
  }
);

// Export all functions for the serve handler
export const inngestFunctions = [
  publishScheduledPost,
  trialWarningCron,
  autoLearnFromPost,
  winBackCron,
  milestoneCheck,
  metricSyncCron,
  dripDay1Cron,
  dripDay3Cron,
  dripDay7Cron,
];
