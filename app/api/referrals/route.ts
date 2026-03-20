import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin() as any;
    if (!admin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Get or create referral code for this user
    const { data: profile } = await admin
      .from("profiles")
      .select("referral_code, bonus_posts")
      .eq("id", user.id)
      .single();

    let referralCode = profile?.referral_code;
    if (!referralCode) {
      referralCode = crypto.randomUUID().slice(0, 8);
      await admin
        .from("profiles")
        .update({ referral_code: referralCode })
        .eq("id", user.id);
    }

    // Get referral stats
    const { data: referrals } = await admin
      .from("referrals")
      .select("id, status, referred_email, created_at, converted_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    const signedUp = (referrals || []).filter((r: any) => r.status === "signed_up" || r.status === "converted").length;
    const converted = (referrals || []).filter((r: any) => r.status === "converted").length;

    return NextResponse.json({
      referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://postpilot.ai"}/auth/signup?ref=${referralCode}`,
      bonusPosts: profile?.bonus_posts || 0,
      stats: {
        totalReferrals: (referrals || []).length,
        signedUp,
        converted,
      },
      referrals: (referrals || []).slice(0, 20),
    });
  } catch (error) {
    console.error("Referrals API error:", error);
    return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
  }
}
