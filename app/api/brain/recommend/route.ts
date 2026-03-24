import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { buildBrainContext } from "@/lib/ai-brain";

export async function GET() {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: userProfile } = await (admin as any)
      .from('profiles')
      .select('subscription_status, trial_ends_at, stripe_customer_id')
      .eq('id', user.id)
      .single();
    if (userProfile && !isSubscriptionActive(userProfile)) {
      return NextResponse.json({
        error: "Your trial has expired. Please upgrade to continue.",
        code: "SUBSCRIPTION_EXPIRED"
      }, { status: 403 });
    }

    // Build brain context
    const context = await buildBrainContext(user.id);

    // Fetch top 5 brand_memory entries by performance_score
    const { data: topPatterns } = await (admin as any)
      .from('brand_memory')
      .select('*')
      .eq('user_id', user.id)
      .order('performance_score', { ascending: false })
      .limit(5);

    return NextResponse.json({
      context,
      topPatterns: topPatterns ?? [],
    });
  } catch (error) {
    console.error("Brain recommend error:", error);
    return NextResponse.json({ error: "Failed to build recommendations" }, { status: 500 });
  }
}
