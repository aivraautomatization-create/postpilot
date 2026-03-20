# OAuth Bug Fixes, Admin Profile & Client UX — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 8 OAuth bugs (including critical XSS), upgrade existing user to business tier, and simplify the social account connection UX for non-technical clients.

**Architecture:** Server-side callback route rewritten to JSON-encode tokens safely instead of embedding in HTML template literals. New `/api/auth/providers` endpoint tells the frontend which platforms are configured. Accounts page cleaned up to hide developer instructions and show "Coming Soon" for unconfigured platforms.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + Auth), TypeScript, Tailwind CSS

---

### Task 1: Upgrade Existing User Profile to Business Tier

**Files:**
- Create: `scripts/upgrade-to-business.ts` (one-time script, delete after use)

**Step 1: Create the upgrade script**

Create `scripts/upgrade-to-business.ts`:

```typescript
// Run with: npx tsx scripts/upgrade-to-business.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

async function upgradeUser() {
  // Find all users (pick the one to upgrade)
  const { data: profiles, error: listErr } = await supabase
    .from('profiles')
    .select('id, full_name, plan_status, subscription_tier')
    .limit(10);

  if (listErr) { console.error('Error listing profiles:', listErr); return; }
  console.log('Existing profiles:', profiles);

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found. Sign up first, then re-run.');
    return;
  }

  // Upgrade the first profile found
  const targetId = profiles[0].id;
  console.log(`Upgrading profile ${targetId} (${profiles[0].full_name}) to business tier...`);

  const { error } = await supabase
    .from('profiles')
    .update({
      plan_status: 'active',
      subscription_tier: 'tier-business',
      trial_claimed: true,
      onboarding_completed: true,
    })
    .eq('id', targetId);

  if (error) { console.error('Upgrade failed:', error); return; }
  console.log('Done! Profile upgraded to business tier.');
}

upgradeUser();
```

**Step 2: Run the script**

Run: `source .env.local && npx tsx scripts/upgrade-to-business.ts`
Expected: "Done! Profile upgraded to business tier."

**Step 3: Verify in app**

Navigate to `/dashboard/settings` in browser. Confirm plan shows "Business" and status "Active".

**Step 4: Commit**

```bash
git add scripts/upgrade-to-business.ts
git commit -m "chore: add one-time script to upgrade profile to business tier"
```

---

### Task 2: Fix OAuth Callback — XSS, False Success, and Origin Issues

This task rewrites `app/api/auth/callback/route.ts` to fix bugs 2.1, 2.2, and 2.3 together (they're all in the same HTML response block).

**Files:**
- Modify: `app/api/auth/callback/route.ts`

**Step 1: Rewrite the callback route**

Replace the entire file content. Key changes:
- Tokens are JSON-encoded and passed via `encodeURIComponent` to avoid XSS
- On error, return an error HTML page with a retry button (no false success)
- `postMessage` targets `baseUrl` instead of wildcard `*`

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;

  // Basic state validation
  if (!state || !savedState || state !== savedState) {
    return new NextResponse(renderErrorHtml('Invalid authentication state. Please try again.'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Handle provider-side errors (user denied, etc.)
  if (errorParam) {
    const errorDesc = searchParams.get('error_description') || 'Authorization was denied.';
    return new NextResponse(renderErrorHtml(errorDesc), {
      headers: { 'Content-Type': 'text/html' },
    });
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

      if (!clientId || !clientSecret) throw new Error('Twitter credentials not configured');

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

      const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      providerAccountId = userResponse.data.data.id;
      providerAccountName = userResponse.data.data.username;

    } else if (provider === 'linkedin' && code) {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

      if (!clientId || !clientSecret) throw new Error('LinkedIn credentials not configured');

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

      if (!clientKey || !clientSecret) throw new Error('TikTok credentials not configured');

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

      if (!clientId || !clientSecret) throw new Error('Facebook credentials not configured');

      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: clientId,
          redirect_uri: redirectUri,
          client_secret: clientSecret,
          code
        }
      });

      accessToken = response.data.access_token;

      const userResponse = await axios.get('https://graph.facebook.com/me', {
        params: { access_token: accessToken }
      });
      providerAccountId = userResponse.data.id;
      providerAccountName = userResponse.data.name;

    } else {
      throw new Error('Unknown provider or missing authorization code');
    }

    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

  } catch (error: any) {
    console.error('OAuth exchange error:', error.response?.data || error.message);
    return new NextResponse(
      renderErrorHtml(error.message || 'Failed to connect your account. Please try again.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Safely encode tokens as JSON string, then URI-encode for embedding in HTML
  const tokenPayload = JSON.stringify({
    type: 'OAUTH_AUTH_SUCCESS',
    provider,
    tokens: {
      accessToken,
      refreshToken,
      providerAccountId,
      providerAccountName,
    }
  });
  const encodedPayload = encodeURIComponent(tokenPayload);

  const html = `
    <!DOCTYPE html>
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
          <h1>Connected Successfully!</h1>
          <p>Your account has been linked.</p>
          <p>This window will close automatically...</p>
        </div>
        <script>
          try {
            var payload = JSON.parse(decodeURIComponent("${encodedPayload}"));
            if (window.opener) {
              window.opener.postMessage(payload, "${baseUrl}");
              setTimeout(function() { window.close(); }, 1500);
            } else {
              window.location.href = '/dashboard/accounts';
            }
          } catch(e) {
            document.querySelector('h1').textContent = 'Connection Error';
            document.querySelector('h1').style.color = '#f87171';
            document.querySelectorAll('p')[0].textContent = 'Something went wrong. Please close this window and try again.';
            document.querySelectorAll('p')[1].textContent = '';
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

function renderErrorHtml(message: string): string {
  // Escape message for safe HTML embedding
  const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `
    <!DOCTYPE html>
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
            max-width: 400px;
          }
          h1 { margin-top: 0; color: #f87171; }
          p { color: rgba(255,255,255,0.6); font-size: 0.9rem; }
          .btn {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: white;
            color: black;
            border: none;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
          }
          .btn:hover { background: #e5e5e5; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Connection Failed</h1>
          <p>${safeMessage}</p>
          <button class="btn" onclick="window.close()">Close Window</button>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: "${safeMessage}" }, '*');
          }
        </script>
      </body>
    </html>
  `;
}
```

**Step 2: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | head -30` or check the dev server for compilation errors.
Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add app/api/auth/callback/route.ts
git commit -m "fix: rewrite OAuth callback to fix XSS, false success, and wildcard postMessage"
```

---

### Task 3: Fix OAuth URL Route — Scopes, Env Validation, Error Feedback

**Files:**
- Modify: `app/api/auth/url/route.ts`

**Step 1: Rewrite the URL route**

Replace the file content. Key changes:
- Return 503 JSON error when provider credentials are missing (no more `example.com` fallback)
- LinkedIn scope updated to `openid profile w_member_social`
- No fallback placeholder values like `'YOUR_TWITTER_CLIENT_ID'`

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Map of provider -> required env var keys
const PROVIDER_CREDENTIALS: Record<string, string[]> = {
  twitter: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
  linkedin: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  facebook: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
  instagram: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
  tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider || !PROVIDER_CREDENTIALS[provider]) {
    return NextResponse.json(
      { error: 'Invalid provider', configured: false },
      { status: 400 }
    );
  }

  // Check credentials are configured
  const requiredKeys = PROVIDER_CREDENTIALS[provider];
  const missing = requiredKeys.filter(key => !process.env[key]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `${provider} is not configured yet. Coming soon!`, configured: false },
      { status: 503 }
    );
  }

  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  let authUrl = '';

  const state = crypto.randomBytes(16).toString('hex') + '_' + provider;

  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: !host?.includes('localhost'),
    sameSite: 'lax',
    maxAge: 60 * 10
  });

  if (provider === 'twitter') {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    cookieStore.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: !host?.includes('localhost'),
      sameSite: 'lax',
      maxAge: 60 * 10
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TWITTER_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;

  } else if (provider === 'linkedin') {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile w_member_social'
    });
    authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params}`;

  } else if (provider === 'facebook' || provider === 'instagram') {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'pages_manage_posts,pages_read_engagement',
      response_type: 'code'
    });
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;

  } else if (provider === 'tiktok') {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      redirect_uri: redirectUri,
      state,
      scope: 'video.publish,video.upload',
      response_type: 'code'
    });
    authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  }

  return NextResponse.json({ url: authUrl });
}
```

**Step 2: Verify compilation**

Check dev server for errors.
Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add app/api/auth/url/route.ts
git commit -m "fix: validate provider credentials before generating OAuth URL, update LinkedIn scopes"
```

---

### Task 4: Add `/api/auth/providers` Endpoint

**Files:**
- Create: `app/api/auth/providers/route.ts`

**Step 1: Create the providers endpoint**

This returns which platforms have OAuth credentials configured, so the frontend knows which to show as "Coming Soon."

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const providers: Record<string, boolean> = {
    twitter: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    instagram: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    tiktok: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
  };

  return NextResponse.json({ providers });
}
```

**Step 2: Verify endpoint works**

Run: `curl http://localhost:3000/api/auth/providers`
Expected: `{"providers":{"twitter":true,"linkedin":false,"facebook":true,"instagram":true,"tiktok":false}}`

**Step 3: Commit**

```bash
git add app/api/auth/providers/route.ts
git commit -m "feat: add /api/auth/providers endpoint for configured platform detection"
```

---

### Task 5: Rewrite Accounts Page — Client UX, Origin Fix, Popup Detection

**Files:**
- Modify: `app/dashboard/accounts/page.tsx`

**Step 1: Rewrite the accounts page**

Key changes:
- Fetch `/api/auth/providers` on mount to know which platforms are configured
- Origin validation uses `window.location.origin` (same-origin) instead of hardcoded `.run.app`
- Handle `OAUTH_AUTH_ERROR` messages from callback
- Poll `authWindow.closed` to reset loading state when popup is closed
- Remove developer setup instructions section entirely
- Show "Coming Soon" badge for unconfigured platforms
- Update info banner to be client-friendly (no mention of callback URLs or developer portals)

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Link as LinkIcon, AlertCircle, Loader2, Linkedin, Twitter, Instagram, Facebook, Clock } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function AccountsPage() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]', hover: 'hover:bg-[#004182]' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black', hover: 'hover:bg-gray-900', border: 'border border-white/20' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]', hover: 'opacity-90' },
    { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: 'bg-[#1877F2]', hover: 'hover:bg-[#0C5ECA]' },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'bg-black', hover: 'hover:bg-gray-900', border: 'border border-white/20' },
  ];

  // Cleanup popup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    // Fetch which providers are configured
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(data => {
        setConfiguredProviders(data.providers || {});
        setLoadingProviders(false);
      })
      .catch(() => setLoadingProviders(false));

    // Load connected accounts from Supabase
    const fetchAccounts = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any)
          .from('social_accounts')
          .select('provider')
          .eq('user_id', user.id);

        if (data) {
          setConnectedAccounts(data.map((a: any) => a.provider));
        }
      }
    };

    fetchAccounts();

    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const provider = event.data.provider;
        const tokens = event.data.tokens;

        const supabase = getSupabase();
        if (supabase && tokens?.accessToken) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await (supabase as any)
              .from('social_accounts')
              .upsert({
                user_id: user.id,
                provider: provider,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken || null,
                provider_account_id: tokens.providerAccountId || null,
                provider_account_name: tokens.providerAccountName || null,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,provider' });
          }
        }

        setConnectedAccounts(prev => {
          const newAccounts = prev.includes(provider) ? prev : [...prev, provider];
          localStorage.setItem('connectedSocialAccounts', JSON.stringify(newAccounts));
          return newAccounts;
        });

        setConnecting(null);
        setError(null);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }

      if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error || 'Connection failed. Please try again.');
        setConnecting(null);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (platformId: string) => {
    try {
      setConnecting(platformId);
      setError(null);

      const response = await fetch(`/api/auth/url?provider=${platformId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start connection. Please try again.');
      }
      const { url } = await response.json();

      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');

      if (!authWindow) {
        setError('Please allow popups for this site to connect your account.');
        setConnecting(null);
        return;
      }

      popupRef.current = authWindow;

      // Poll for popup close to reset connecting state
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (authWindow.closed) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          // Give a small delay for postMessage to arrive before resetting
          setTimeout(() => {
            setConnecting(prev => {
              if (prev === platformId) return null;
              return prev;
            });
          }, 500);
        }
      }, 1000);

    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || 'An error occurred while connecting.');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any)
            .from('social_accounts')
            .delete()
            .eq('user_id', user.id)
            .eq('provider', platformId);
        }
      }
    } catch (err) {
      console.error('Failed to disconnect account:', err);
    }

    setConnectedAccounts(prev => {
      const newAccounts = prev.filter(id => id !== platformId);
      localStorage.setItem('connectedSocialAccounts', JSON.stringify(newAccounts));
      return newAccounts;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Connected Accounts</h2>
        <p className="text-white/50">Link your social media profiles to enable one-click auto-publishing.</p>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <div className="flex items-start gap-3 mb-6 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-emerald-400/90 font-medium">
              Connect your accounts securely via OAuth.
            </p>
            <p className="text-xs text-emerald-400/70">
              We never store your passwords. Click Connect to authorize Postpilot to publish on your behalf. You can disconnect at any time.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {platforms.map((platform) => {
            const isConnected = connectedAccounts.includes(platform.id);
            const isConnecting = connecting === platform.id;
            const isConfigured = configuredProviders[platform.id] !== false;
            const Icon = platform.icon;

            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.color} ${platform.border || ''}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{platform.name}</h3>
                    <p className="text-sm text-white/50">
                      {isConnected
                        ? 'Connected and ready to publish'
                        : !isConfigured && !loadingProviders
                          ? 'Coming soon'
                          : 'Not connected'}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      className="text-sm text-white/40 hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-400/10"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : !isConfigured && !loadingProviders ? (
                  <span className="flex items-center gap-1.5 text-sm text-white/30 font-medium px-4 py-2">
                    <Clock className="w-4 h-4" />
                    Coming Soon
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting || loadingProviders}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify in browser**

Navigate to `/dashboard/accounts`. Confirm:
- LinkedIn and TikTok show "Coming Soon" (no credentials in .env)
- Twitter, Facebook, Instagram show "Connect" buttons
- No developer setup instructions section visible
- Clicking Connect opens popup; closing popup resets loading state

**Step 3: Commit**

```bash
git add app/dashboard/accounts/page.tsx
git commit -m "fix: simplify accounts page UX, fix origin validation, add popup close detection"
```

---

### Task 6: Verify All Changes End-to-End

**Step 1: Check dev server compiles clean**

Run: `npx next build --no-lint 2>&1 | tail -10`
Expected: Build succeeds, no TypeScript errors.

**Step 2: Verify accounts page in browser**

- Navigate to `/dashboard/accounts`
- Confirm LinkedIn/TikTok show "Coming Soon"
- Confirm Twitter/Facebook/Instagram show Connect buttons
- No developer instructions section visible

**Step 3: Test OAuth URL endpoint**

Run: `curl http://localhost:3000/api/auth/url?provider=twitter` — should return `{ url: "https://twitter.com/..." }`
Run: `curl http://localhost:3000/api/auth/url?provider=linkedin` — should return `503` with error about not configured
Run: `curl http://localhost:3000/api/auth/providers` — should show configured status for each platform

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete OAuth bug fixes, admin profile, and client UX improvements"
```
