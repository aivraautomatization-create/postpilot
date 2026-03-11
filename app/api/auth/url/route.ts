import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  
  // Get the base URL from the request to construct the redirect URI
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  let authUrl = '';

  // Generate a random state string
  const state = crypto.randomBytes(16).toString('hex') + '_' + provider;
  
  // Store state in cookie for verification later
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'none',
    maxAge: 60 * 10 // 10 minutes
  });

  if (provider === 'twitter') {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    cookieStore.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 10
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TWITTER_CLIENT_ID || 'YOUR_TWITTER_CLIENT_ID',
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;
  } else if (provider === 'linkedin') {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID || 'YOUR_LINKEDIN_CLIENT_ID',
      redirect_uri: redirectUri,
      state: state,
      scope: 'w_member_social'
    });
    authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  } else if (provider === 'facebook' || provider === 'instagram') {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID || 'YOUR_FACEBOOK_CLIENT_ID',
      redirect_uri: redirectUri,
      state: state,
      scope: 'pages_manage_posts,pages_read_engagement',
      response_type: 'code'
    });
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  } else if (provider === 'tiktok') {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || 'YOUR_TIKTOK_CLIENT_KEY',
      redirect_uri: redirectUri,
      state: state,
      scope: 'video.publish,video.upload',
      response_type: 'code'
    });
    authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  } else {
    // Fallback
    const params = new URLSearchParams({
      client_id: 'demo_client_id',
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state
    });
    authUrl = `https://example.com/oauth/authorize?${params}`;
  }

  return NextResponse.json({ url: authUrl });
}
