/**
 * Serverless-safe rate limiter backed by Supabase.
 *
 * Why not in-memory Map?
 * - Serverless functions (Vercel) spawn fresh instances on cold start
 * - In-memory Maps don't persist across invocations
 * - This uses the Supabase DB you already have — zero new dependencies
 *
 * Falls back to in-memory if Supabase isn't available (dev/testing).
 */

import { RATE_LIMITS } from './rate-limit';

// In-memory fallback for development/testing
const memoryStore = new Map<string, { count: number; windowStart: number }>();

/**
 * Check rate limit using Supabase RPC or in-memory fallback.
 * For production, call the Supabase RPC function `check_rate_limit`.
 * For dev/test, uses in-memory store.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
  supabaseAdmin?: ReturnType<typeof import('./supabase').getSupabaseAdmin> extends infer T ? T : never
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Try Supabase-backed rate limiting first
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_ms: windowMs,
      });

      if (!error && data !== null) {
        return {
          allowed: data.allowed,
          retryAfter: data.retry_after || undefined,
        };
      }
    } catch {
      // Fall through to in-memory
    }
  }

  // In-memory fallback (works fine for single-instance dev)
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    memoryStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

// Periodic cleanup for in-memory store (dev only)
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (now - entry.windowStart > 5 * 60 * 1000) {
        memoryStore.delete(key);
      }
    }
  };

  // Use globalThis to avoid duplicate intervals in dev hot-reload
  const globalKey = '__puls_rate_limit_cleanup';
  const g = globalThis as typeof globalThis & Record<string, unknown>;
  if (!g[globalKey]) {
    g[globalKey] = setInterval(cleanup, 60 * 1000);
  }
}

export { RATE_LIMITS };
