# Puls: OAuth Bug Fixes, Admin Profile & Client UX

**Date:** 2026-03-11
**Status:** Approved

## Context

Puls's social media OAuth connection flow has several bugs (XSS, false success, origin issues) and shows developer-facing setup instructions to all users. Additionally, need an admin test profile with business tier for full feature testing.

## Part 1: Admin Test Profile

Upgrade existing user's profile to business tier directly in Supabase:
- `plan_status: 'active'`
- `subscription_tier: 'tier-business'`
- `trial_claimed: true`
- `onboarding_completed: true`

## Part 2: OAuth Bug Fixes

### 2.1 XSS Vulnerability in Callback (Critical)
**File:** `app/api/auth/callback/route.ts`
**Problem:** Tokens embedded in HTML template literals. Special chars in tokens break JS.
**Fix:** Pass tokens via URL hash fragment. The accounts page reads hash params on load.

### 2.2 False Success on Error (Critical)
**File:** `app/api/auth/callback/route.ts`
**Problem:** Catch block swallows errors and still shows success page.
**Fix:** Return error HTML page with retry button when token exchange fails.

### 2.3 postMessage Wildcard Origin
**File:** `app/api/auth/callback/route.ts`
**Problem:** `postMessage({...}, '*')` sends tokens to any origin.
**Fix:** Use the opener's origin or construct from APP_URL env var.

### 2.4 Origin Validation Too Restrictive
**File:** `app/dashboard/accounts/page.tsx`
**Problem:** Only `.run.app` and `localhost` origins accepted.
**Fix:** Accept messages from `window.location.origin` (same-origin check).

### 2.5 LinkedIn Scopes Outdated
**File:** `app/api/auth/url/route.ts`
**Problem:** Missing `openid profile` scopes for userinfo endpoint.
**Fix:** Change scope to `openid profile w_member_social`.

### 2.6 Missing Env Var Error Feedback
**File:** `app/api/auth/url/route.ts`
**Problem:** Falls through to `example.com` when env vars missing.
**Fix:** Return 503 JSON error when provider credentials not configured.

### 2.7 Developer Instructions Visible to Clients
**File:** `app/dashboard/accounts/page.tsx`
**Problem:** OAuth setup instructions shown to all users.
**Fix:** Only show setup section if any platform lacks configured credentials (checked via API). For clients, show "Coming Soon" on unconfigured platforms.

### 2.8 Loading State Hangs
**File:** `app/dashboard/accounts/page.tsx`
**Problem:** If popup is closed manually, "Connecting..." stays forever.
**Fix:** Poll popup.closed every second, reset state when detected.

## Part 3: Client UX Simplification

- Add `/api/auth/providers` endpoint returning which platforms have credentials configured
- Platforms without credentials show "Coming Soon" badge instead of broken Connect button
- Remove developer setup instructions section from client view
- Add clear, user-friendly error messages
- Add popup-close detection with auto-reset

## Non-Goals
- No admin panel or role system (out of scope)
- No new OAuth providers
- No token refresh logic changes
