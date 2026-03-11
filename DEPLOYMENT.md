# PostPilot — Production Deployment & Setup Guide

## 📋 Overview

PostPilot is now **production-ready** with all critical features implemented:

- ✅ Real OAuth token exchange (Twitter, LinkedIn, Facebook, TikTok)
- ✅ Real social media publishing (all 4 platforms)
- ✅ Server-side auth middleware
- ✅ Stripe integration with DB persistence
- ✅ Scheduled post publishing (via Inngest)
- ✅ Rate limiting on all endpoints

---

## 🚀 Deployment Checklist

### 1. **Supabase Setup**

Run the schema from `supabase/schema.sql` in your Supabase SQL editor:

```sql
-- Dashboard → SQL Editor → New query
-- Paste contents of supabase/schema.sql and execute
```

**Tables created:**
- `profiles` — User subscriptions & Stripe IDs
- `social_connections` — OAuth tokens for Twitter, LinkedIn, Facebook, TikTok

**RLS policies applied** — Users can only access their own data.

---

### 2. **Environment Variables** (`.env.local`)

Copy `.env.example` → `.env.local` and fill in all required values:

```bash
# ─── App Config ───────────────────────────────
APP_URL=https://yourapp.com          # Production domain
NEXT_PUBLIC_APP_URL=https://yourapp.com

# ─── Gemini API ────────────────────────────────
GEMINI_API_KEY=sk_live_...           # From Google AI Studio

# ─── Supabase ──────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # Secret — used in API routes

# ─── Stripe ────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...        # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...      # From Webhooks settings

# ─── OAuth Providers ──────────────────────────
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...

# ─── Inngest (Scheduled Posts) ─────────────────
INNGEST_EVENT_KEY=...                # Optional for production
INNGEST_SIGNING_KEY=...
```

---

### 3. **Stripe Configuration**

#### A. Create Stripe Products

In Stripe Dashboard:

1. Go to **Products**
2. Create 3 products:
   - **Entry** — $69/month → Copy Product ID
   - **Pro** — $99/month → Copy Product ID
   - **Business** — $199/month → Copy Product ID

3. Update `app/api/checkout/route.ts` with correct product IDs:

```typescript
const products: Record<string, string> = {
  'tier-entry': 'prod_YOUR_ID_HERE',
  'tier-pro': 'prod_YOUR_ID_HERE',
  'tier-business': 'prod_YOUR_ID_HERE',
};
```

#### B. Setup Webhook

1. Go to **Webhooks** in Stripe Dashboard
2. Create webhook endpoint:
   - **URL:** `https://yourapp.com/api/webhooks/stripe`
   - **Events to send:**
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

3. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET` env var

---

### 4. **Inngest Setup** (Scheduled Posts)

Inngest is **optional** but recommended for production scheduled posts.

#### A. Create Inngest Account

1. Go to https://inngest.com (free tier: 50k events/month)
2. Create new app
3. Get credentials:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`

#### B. Deploy to Production

For **Vercel** deployment:

1. Connect GitHub repo to Vercel
2. Add environment variables
3. During build, Vercel will automatically:
   - Detect `app/api/inngest/route.ts`
   - Register your functions with Inngest Cloud

4. In Inngest Dashboard, set return URL:
   - **Dashboard → Apps → PostPilot**
   - Validate endpoint: `https://yourapp.com/api/inngest`

#### C. Local Testing

For local development, Inngest works **without credentials**:

```bash
npm install inngest
npm run dev
```

Visit http://localhost:3000/api/inngest to see function registry.

To test scheduled posts locally, send:

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post",
    "platforms": ["linkedin", "facebook"],
    "scheduledDate": "2026-03-10T14:00:00Z"
  }'
```

Response will show status: `"scheduled"` for each platform.

---

### 5. **OAuth Provider Setup**

#### Twitter / X

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create "Web App" with OAuth 2.0
3. Set **Callback URLs:**
   - `https://yourapp.com/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for dev)
4. Enable **User consent settings:**
   - "Write" permissions (required to post)
5. Copy credentials → `.env.local`

#### LinkedIn

1. Go to https://www.linkedin.com/developers/apps
2. Create app & authorize
3. Add **Authorized redirect URLs:**
   - `https://yourapp.com/api/auth/callback`
4. Request **Sign In with LinkedIn** and **Share on LinkedIn** permissions
5. Copy credentials → `.env.local`

#### Facebook / Instagram

1. Go to https://developers.facebook.com
2. Create app, select **App Type: Consumer**
3. Add **Facebook Login** product
4. Set **Valid OAuth Redirect URIs:**
   - `https://yourapp.com/api/auth/callback`
5. Create Page Access Token (for posting)
6. Copy credentials → `.env.local`

#### TikTok

1. Go to https://developer.tiktok.com
2. Create developer account & application
3. Add **OAuth Redirect URLs:**
   - `https://yourapp.com/api/auth/callback`
4. Request **video.publish** scope (Business Account required)
5. Copy credentials → `.env.local`

---

### 6. **Database Schema Migration**

The schema includes:

```sql
-- Profiles table
- id (UUID, foreign key to auth.users)
- stripe_customer_id (Stripe customer ID)
- subscription_tier (tier-entry | tier-pro | tier-business)
- subscription_status (active | inactive | past_due | canceled)
- created_at, updated_at

-- Social connections table
- user_id, provider, provider_account_id
- access_token, refresh_token, token_expires_at
- Unique constraint: (user_id, provider)
- Automatic cleanup on user delete
```

**Auto-creation:** Profiles are auto-created when a user signs up via Supabase trigger.

---

### 7. **Deployment to Vercel**

```bash
# 1. Push to GitHub
git add .
git commit -m "feat: postpilot production ready"
git push origin main

# 2. Connect to Vercel
vercel link

# 3. Add environment variables
vercel env add

# 4. Deploy
vercel deploy --prod
```

---

## 🛡️ Security Checklist

- ✅ **API Key Protection:** Gemini key is server-side only (NOT NEXT_PUBLIC)
- ✅ **Auth Middleware:** All /dashboard routes protected by Supabase session check
- ✅ **Endpoint Auth:** /api/checkout, /api/portal require authenticated user
- ✅ **Rate Limiting:** Applied to OAuth callback, AI, and publish endpoints
- ✅ **CSRF:** OAuth state parameter prevents cross-site attacks
- ✅ **Webhook Verification:** Stripe webhook signatures verified with secret
- ✅ **Token Refresh:** OAuth tokens automatically refreshed when expired
- ✅ **RLS Policies:** Supabase RLS prevents users from accessing other users' data
- ✅ **postMessage Origin:** Exact domain matching (no wildcards)

---

## 📝 Known Limitations

1. **Email Notifications:** Not yet implemented (no Resend/SendGrid)
   - Missing: Payment failure emails, subscription confirmations
   - To add: Integrate Resend in webhook handlers

2. **Analytics:** No GA / PostHog / Mixpanel
   - To add: Instrument key user flows

3. **Light Mode:** Dashboard is dark-only
   - To add: Theme toggle in settings

4. **Error Tracking:** No Sentry
   - To add: Wrap API routes with Sentry capture

---

## 🔗 Useful Links

- **Inngest Docs:** https://inngest.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs/api
- **Next.js Middleware:** https://nextjs.org/docs/app/building-your-application/working-with-files/middleware
- **OAuth PKCE Flow:** https://tools.ietf.org/html/rfc7636

---

## ❓ Troubleshooting

### Scheduled posts not firing

1. Check Inngest status: https://app.inngest.com (if using cloud)
2. Verify webhook endpoint is accessible: `https://yourapp.com/api/inngest`
3. Check logs: `vercel logs -f`

### OAuth callback fails

1. Verify callback URL matches provider settings
2. Check credentials in `.env.local`
3. Test with: `curl -X GET https://yourapp.com/api/auth/url?provider=twitter`

### Stripe webhook not updating DB

1. Verify webhook secret in `.env.local`
2. Check Stripe Dashboard → Webhooks → Events
3. Review Supabase profiles table directly

---

**✅ Deployment complete! PostPilot is now production-ready.**
