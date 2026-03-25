import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { learnFromPost } from "@/lib/ai-brain";

export async function POST(req: Request) {
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
    if (admin) {
      const { data: userProfile } = await admin
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
    }

    const { postId } = await req.json();

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    await learnFromPost(user.id, postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brain learn error:", error);
    return NextResponse.json({ error: "Failed to learn from post" }, { status: 500 });
  }
}
