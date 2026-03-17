import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const PROVIDER_CREDENTIALS: Record<string, string[]> = {
  twitter: ['TWITTER_CLIENT_ID'],
  linkedin: ['LINKEDIN_CLIENT_ID'],
  facebook: ['FACEBOOK_CLIENT_ID'],
  instagram: ['FACEBOOK_CLIENT_ID'],
  tiktok: ['TIKTOK_CLIENT_KEY'],
  google: ['GOOGLE_CLIENT_ID'],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  // Validate provider
  if (!provider || !PROVIDER_CREDENTIALS[provider]) {
    return NextResponse.json(
      { error: `Unknown or missing provider: ${provider}` },
      { status: 400 }
    );
  }

  // Check required env vars for this provider
  const missing = PROVIDER_CREDENTIALS[provider].filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `${provider} is not configured. Missing env: ${missing.join(', ')}`,
        configured: false,
      },
      { status: 503 }
    );
  }

  // Get the base URL from the request to construct the redirect URI
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  const isLocalhost = host?.includes('localhost');

  let authUrl = '';

  // Generate a random state string
  const state = crypto.randomBytes(16).toString('hex') + '_' + provider;

  // Store state in cookie for verification later
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  if (provider === 'twitter') {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    cookieStore.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: 'lax',
      maxAge: 60 * 10,
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TWITTER_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;
  } else if (provider === 'linkedin') {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state: state,
      scope: 'openid profile w_member_social',
    });
    authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  } else if (provider === 'facebook' || provider === 'instagram') {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      redirect_uri: redirectUri,
      state: state,
      scope: 'public_profile,pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management',
      response_type: 'code',
    });
    authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
  } else if (provider === 'tiktok') {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      redirect_uri: redirectUri,
      state: state,
      scope: 'video.publish,video.upload',
      response_type: 'code',
    });
    authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  } else if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.upload',
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  return NextResponse.json({ url: authUrl });
}
