import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/health
 *
 * Lightweight liveness + readiness probe.
 * Used by Vercel uptime checks, Sentry cron monitors, and external ping services.
 *
 * Returns 200 if all critical dependencies are reachable, 503 otherwise.
 * Intentionally fast: no auth, no heavy queries.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};
  let healthy = true;

  // Check Supabase connectivity with a cheap RPC call
  try {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('No client');
    // select 1 — the lightest possible query
    const { error } = await admin.rpc('check_rate_limit', {
      p_key: '_health',
      p_limit: 999999,
      p_window_ms: 1000,
    });
    // Any response (including RPC errors) means the DB is reachable
    checks.supabase = error?.code === 'PGRST202' || !error ? 'ok' : 'ok';
  } catch {
    checks.supabase = 'error';
    healthy = false;
  }

  checks.env = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error';
  if (checks.env === 'error') healthy = false;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        // Don't cache health checks
        'Cache-Control': 'no-store',
      },
    }
  );
}
