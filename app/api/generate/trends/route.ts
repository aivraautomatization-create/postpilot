import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { searchTrends } from "@/lib/perplexity";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSubscriptionActive } from "@/lib/plan-limits";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit: 5 per minute
    const { allowed, retryAfter } = checkRateLimit(`trends:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: profile } = await (admin as any)
        .from('profiles')
        .select('subscription_status, trial_ends_at, stripe_customer_id')
        .eq('id', user.id)
        .single();
      if (profile && !isSubscriptionActive(profile)) {
        return NextResponse.json({
          error: "Your trial has expired. Please upgrade to continue.",
          code: "SUBSCRIPTION_EXPIRED"
        }, { status: 403 });
      }
    }

    const { niche, platform } = await req.json();

    if (!niche || !platform) {
      return NextResponse.json({ error: "Niche and platform are required" }, { status: 400 });
    }

    const trends = await searchTrends(niche, platform);

    if (!trends) {
      return NextResponse.json({
        error: "Trend research unavailable. Configure PERPLEXITY_API_KEY to enable.",
        code: "SERVICE_UNAVAILABLE"
      }, { status: 503 });
    }

    return NextResponse.json({ trends });
  } catch (error: any) {
    console.error("Trends error:", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
