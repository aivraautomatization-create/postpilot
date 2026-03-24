import { inngest } from './inngest';
import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { sendTrialWarningEmail } from './emails';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
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
      const account = accounts.find((a: any) => a.provider === platform);

      if (!account) {
        results[platform] = { status: 'error', message: `Account not connected for ${platform}` };
        continue;
      }

      try {
        if (platform === 'twitter') {
          const client = new TwitterApi(account.access_token);
          if (imageUrl) {
            try {
              const imageBuffer = await downloadImage(imageUrl);
              const mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/png' });
              await client.v2.tweet({ text: content.substring(0, 280), media: { media_ids: [mediaId] } });
            } catch {
              await client.v2.tweet(content.substring(0, 280));
            }
          } else {
            await client.v2.tweet(content.substring(0, 280));
          }
          results[platform] = { status: 'success', message: 'Successfully posted to X (Twitter)' };
          hasSuccess = true;
        } else if (platform === 'facebook' || platform === 'instagram') {
          const pageId = account.provider_account_id;
          if (imageUrl) {
            await axios.post(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
              url: imageUrl, caption: content, access_token: account.access_token,
            });
          } else {
            await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
              message: content, access_token: account.access_token,
            });
          }
          results[platform] = { status: 'success', message: `Successfully posted to ${platform}` };
          hasSuccess = true;
        } else if (platform === 'linkedin') {
          const personUrn = account.provider_account_id;
          if (imageUrl) {
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
            const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            const asset = registerResponse.data.value.asset;
            const imageBuffer = await downloadImage(imageUrl);
            await axios.put(uploadUrl, imageBuffer, {
              headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'image/png' },
            });
            await axios.post('https://api.linkedin.com/v2/ugcPosts', {
              author: `urn:li:person:${personUrn}`, lifecycleState: 'PUBLISHED',
              specificContent: {
                'com.linkedin.ugc.ShareContent': {
                  shareCommentary: { text: content }, shareMediaCategory: 'IMAGE',
                  media: [{ status: 'READY', media: asset }],
                },
              },
              visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
            }, { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } });
          } else {
            await axios.post('https://api.linkedin.com/v2/ugcPosts', {
              author: `urn:li:person:${personUrn}`, lifecycleState: 'PUBLISHED',
              specificContent: {
                'com.linkedin.ugc.ShareContent': {
                  shareCommentary: { text: content }, shareMediaCategory: 'NONE',
                },
              },
              visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
            }, { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } });
          }
          results[platform] = { status: 'success', message: 'Successfully posted to LinkedIn' };
          hasSuccess = true;
        } else if (platform === 'tiktok') {
          if (!videoUrl && !imageUrl) {
            results[platform] = { status: 'error', message: 'TikTok requires an image or video' };
            continue;
          }
          if (imageUrl) {
            await axios.post('https://open.tiktokapis.com/v2/post/publish/content/init/', {
              post_info: { title: content.substring(0, 150), privacy_level: 'SELF_ONLY' },
              source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: [imageUrl] },
              post_mode: 'DIRECT_POST', media_type: 'PHOTO',
            }, { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } });
          } else if (videoUrl) {
            await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
              post_info: { title: content.substring(0, 150), privacy_level: 'SELF_ONLY' },
              source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
            }, { headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' } });
          }
          results[platform] = { status: 'success', message: 'Successfully posted to TikTok' };
          hasSuccess = true;
        } else {
          results[platform] = { status: 'error', message: `Publishing to ${platform} is not yet supported` };
        }
      } catch (err: any) {
        console.error(`Scheduled publish to ${platform} failed:`, err.message);
        results[platform] = { status: 'error', message: `Failed: ${err.message}` };
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

// Export all functions for the serve handler
export const inngestFunctions = [publishScheduledPost, trialWarningCron, autoLearnFromPost];
