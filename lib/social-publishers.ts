import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ─── Shared helpers ───────────────────────────────────────────────

export async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const mimeType = response.headers['content-type'] || 'image/png';
  return { buffer: Buffer.from(response.data), mimeType };
}

export async function downloadVideo(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const mimeType = response.headers['content-type'] || 'video/mp4';
  return { buffer: Buffer.from(response.data), mimeType };
}

function createMultipartBody(videoBuffer: Buffer, mimeType: string, metadata: Record<string, unknown>): Buffer {
  const boundary = 'foo_bar_baz';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  return Buffer.concat([
    Buffer.from(delimiter),
    Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(delimiter),
    Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
    videoBuffer,
    Buffer.from(closeDelimiter),
  ]);
}

// ─── Per-platform publishers ──────────────────────────────────────

export async function publishToTwitter(
  token: string,
  content: string,
  imageUrl?: string | null,
): Promise<void> {
  const client = new TwitterApi(token);
  if (imageUrl) {
    const { buffer, mimeType } = await downloadImage(imageUrl);
    const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
    await client.v2.tweet({ text: content.substring(0, 280), media: { media_ids: [mediaId] } });
  } else {
    await client.v2.tweet(content.substring(0, 280));
  }
}

export async function publishToFacebook(
  token: string,
  pageId: string,
  content: string,
  imageUrl?: string | null,
): Promise<void> {
  if (imageUrl) {
    await axios.post(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      url: imageUrl,
      caption: content,
      access_token: token,
    });
  } else {
    await axios.post(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      message: content,
      access_token: token,
    });
  }
}

export async function publishToInstagram(
  token: string,
  igUserId: string,
  content: string,
  imageUrl: string,
): Promise<void> {
  // Instagram requires 2-step: create container → publish
  const containerResponse = await axios.post(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    image_url: imageUrl,
    caption: content,
    access_token: token,
  });
  await axios.post(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    creation_id: containerResponse.data.id,
    access_token: token,
  });
}

export async function publishToLinkedIn(
  token: string,
  personUrn: string,
  content: string,
  imageUrl?: string | null,
): Promise<void> {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  if (imageUrl) {
    // Step 1: Register upload
    const regResp = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${personUrn}`,
        serviceRelationships: [
          { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
        ],
      },
    }, { headers });

    const uploadUrl = regResp.data.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl;
    const asset = regResp.data.value.asset;

    // Step 2: Upload image
    const { buffer, mimeType } = await downloadImage(imageUrl);
    await axios.put(uploadUrl, buffer, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': mimeType },
    });

    // Step 3: Create post with image
    await axios.post('https://api.linkedin.com/v2/ugcPosts', {
      author: `urn:li:person:${personUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'IMAGE',
          media: [{ status: 'READY', media: asset }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }, { headers });
  } else {
    await axios.post('https://api.linkedin.com/v2/ugcPosts', {
      author: `urn:li:person:${personUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }, { headers });
  }
}

export async function publishToTikTok(
  token: string,
  content: string,
  imageUrl?: string | null,
  videoUrl?: string | null,
): Promise<void> {
  if (!videoUrl && !imageUrl) {
    throw new Error('TikTok requires an image or video to publish');
  }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  if (imageUrl) {
    await axios.post('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      post_info: { title: content.substring(0, 150), privacy_level: 'SELF_ONLY' },
      source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: [imageUrl] },
      post_mode: 'DIRECT_POST',
      media_type: 'PHOTO',
    }, { headers });
  } else if (videoUrl) {
    await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      post_info: { title: content.substring(0, 150), privacy_level: 'SELF_ONLY' },
      source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
    }, { headers });
  }
}

export async function publishToYouTube(
  token: string,
  content: string,
  videoUrl: string,
): Promise<void> {
  const { buffer, mimeType } = await downloadVideo(videoUrl);
  const body = createMultipartBody(buffer, mimeType, {
    snippet: {
      title: content.substring(0, 100) || 'New Video',
      description: content,
      categoryId: '22',
    },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  });

  await axios.post(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/related; boundary=foo_bar_baz',
      },
    },
  );
}

// ─── Unified dispatcher ──────────────────────────────────────────

export type PlatformName = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube';

interface PublishParams {
  platform: PlatformName;
  token: string;
  accountId: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

/**
 * Publish content to a single platform.
 * Throws on failure — caller handles retries / token refresh.
 */
export async function publishToPlatform(params: PublishParams): Promise<void> {
  const { platform, token, accountId, content, imageUrl, videoUrl } = params;

  switch (platform) {
    case 'twitter':
      return publishToTwitter(token, content, imageUrl);
    case 'facebook':
      return publishToFacebook(token, accountId, content, imageUrl);
    case 'instagram':
      if (!imageUrl) throw new Error('Instagram requires an image to publish a post.');
      return publishToInstagram(token, accountId, content, imageUrl);
    case 'linkedin':
      return publishToLinkedIn(token, accountId, content, imageUrl);
    case 'tiktok':
      return publishToTikTok(token, content, imageUrl, videoUrl);
    case 'youtube':
      if (!videoUrl) throw new Error('YouTube requires a video to publish');
      return publishToYouTube(token, content, videoUrl);
    default:
      throw new Error(`Platform ${platform} not supported`);
  }
}
