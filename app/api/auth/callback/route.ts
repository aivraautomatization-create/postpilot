import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

function successHtml(payload: string, baseUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Authentication Successful</title>
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background-color: #050505;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        text-align: center;
      }
      .container {
        background: #111;
        padding: 2rem;
        border-radius: 1rem;
        border: 1px solid rgba(255,255,255,0.1);
      }
      h1 { margin-top: 0; color: #34d399; }
      p { color: rgba(255,255,255,0.6); }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Authentication Successful</h1>
      <p>You have successfully connected your account.</p>
      <p>This window will close automatically...</p>
    </div>
    <script>
      (function() {
        try {
          var payload = JSON.parse(decodeURIComponent("${payload}"));
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              provider: payload.provider,
              tokens: payload.tokens
            }, ${JSON.stringify(baseUrl)});
            setTimeout(function() { window.close(); }, 1500);
          } else {
            setTimeout(function() {
              window.location.href = '/dashboard/accounts';
            }, 2000);
          }
        } catch (e) {
          console.error('Failed to parse OAuth payload', e);
        }
      })();
    </script>
  </body>
</html>`;
}

function errorHtml(message: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Connection Failed</title>
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background-color: #050505;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        text-align: center;
      }
      .container {
        background: #111;
        padding: 2rem;
        border-radius: 1rem;
        border: 1px solid rgba(255,255,255,0.1);
      }
      h1 { margin-top: 0; color: #ef4444; }
      p { color: rgba(255,255,255,0.6); }
      button {
        margin-top: 1rem;
        padding: 0.5rem 1.5rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 1rem;
      }
      button:hover { background: #dc2626; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Connection Failed</h1>
      <p>${escapeHtml(message)}</p>
      <button onclick="window.close()">Close</button>
    </div>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Handle provider error param (user denied access)
  const oauthError = searchParams.get('error');
  if (oauthError) {
    const description = searchParams.get('error_description') || 'Access was denied or the authorization was cancelled.';
    return new NextResponse(errorHtml(description), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state'); // provider name

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;

  // Basic state validation
  if (!state || !savedState || state !== savedState) {
    return new NextResponse('Invalid state parameter', { status: 400 });
  }

  const provider = state.split('_').pop();

  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  let accessToken = '';
  let refreshToken = '';
  let providerAccountId = '';
  let providerAccountName = '';

  try {
    if (provider === 'twitter' && code) {
      const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;
      if (!codeVerifier) throw new Error('Missing code verifier');

      const clientId = process.env.TWITTER_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing Twitter client credentials');
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await axios.post('https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token || '';

      // Fetch user info
      const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      providerAccountId = userResponse.data.data.id;
      providerAccountName = userResponse.data.data.username;
    } else if (provider === 'linkedin' && code) {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing LinkedIn client credentials');
      }

      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token || '';

      const userResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      providerAccountId = userResponse.data.sub;
      providerAccountName = userResponse.data.name || `${userResponse.data.given_name || ''} ${userResponse.data.family_name || ''}`.trim();
    } else if (provider === 'tiktok' && code) {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

      if (!clientKey || !clientSecret) {
        throw new Error('Missing TikTok client credentials');
      }

      const tokenResponse = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token || '';

      const userResponse = await axios.get(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      providerAccountId = tokenResponse.data.open_id || userResponse.data.data?.user?.open_id || '';
      providerAccountName = userResponse.data.data?.user?.display_name || 'TikTok User';
    } else if ((provider === 'facebook' || provider === 'instagram') && code) {
      const clientId = process.env.FACEBOOK_CLIENT_ID;
      const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing Facebook client credentials');
      }

      // Step 1: Exchange code for short-lived user token
      const tokenResponse = await axios.get(`https://graph.facebook.com/v21.0/oauth/access_token`, {
        params: {
          client_id: clientId,
          redirect_uri: redirectUri,
          client_secret: clientSecret,
          code
        }
      });

      const shortLivedToken = tokenResponse.data.access_token;

      // Step 2: Exchange for long-lived user token
      const longLivedResponse = await axios.get(`https://graph.facebook.com/v21.0/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: shortLivedToken,
        }
      });

      const longLivedUserToken = longLivedResponse.data.access_token;

      // Step 3: Fetch user's Pages (returns Page IDs + Page access tokens)
      const pagesResponse = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
        params: { access_token: longLivedUserToken }
      });

      const pages = pagesResponse.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('No Facebook Pages found. Please create a Facebook Page first.');
      }

      const page = pages[0]; // Use the first page

      if (provider === 'instagram') {
        // Step 4a: For Instagram, get the linked Instagram Business Account
        const igResponse = await axios.get(`https://graph.facebook.com/v21.0/${page.id}`, {
          params: {
            fields: 'instagram_business_account',
            access_token: page.access_token,
          }
        });

        const igAccountId = igResponse.data.instagram_business_account?.id;
        if (!igAccountId) {
          throw new Error('No Instagram Business Account linked to your Facebook Page. Please connect an Instagram Business or Creator account to your Page.');
        }

        // Fetch Instagram account info
        const igInfoResponse = await axios.get(`https://graph.facebook.com/v21.0/${igAccountId}`, {
          params: {
            fields: 'username',
            access_token: page.access_token,
          }
        });

        accessToken = page.access_token;
        providerAccountId = igAccountId;
        providerAccountName = igInfoResponse.data.username || 'Instagram Account';
      } else {
        // Step 4b: For Facebook, use the Page token directly
        accessToken = page.access_token;
        providerAccountId = page.id;
        providerAccountName = page.name;
      }
    } else if (provider === 'google' && code) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing Google client credentials');
      }

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token || '';

      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      providerAccountId = userResponse.data.sub;
      providerAccountName = userResponse.data.name || userResponse.data.email || 'Google User';
    }
  } catch (error: any) {
    console.error('OAuth exchange error:', error.response?.data || error.message);
    const message = error.response?.data?.error_description || error.message || 'An unexpected error occurred during authentication.';
    return new NextResponse(errorHtml(message), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const payload = encodeURIComponent(JSON.stringify({
    provider,
    tokens: {
      accessToken,
      refreshToken,
      providerAccountId,
      providerAccountName,
    }
  }));

  return new NextResponse(successHtml(payload, baseUrl), {
    headers: { 'Content-Type': 'text/html' },
  });
}
