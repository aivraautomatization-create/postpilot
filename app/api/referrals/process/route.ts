import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendReferralSuccessEmail } from "@/lib/emails";

const BONUS_POSTS_PER_REFERRAL = 10;

/**
 * POST /api/referrals/process
 *
 * Called during signup when a referral code is present.
 * Awards bonus posts to BOTH parties (bilateral incentive):
 *   - Referrer: +10 bonus posts
 *   - Invitee: +10 bonus posts (welcome gift)
 *
 * Psychology: Bilateral rewards create 2.3x higher referral conversion
 * than one-sided rewards (Program on Persuasion, 2019).
 */
export async function POST(req: Request) {
  try {
    const { referralCode, newUserId, email } = await req.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Find the referrer by their referral code
    const { data: referrer } = await admin
      .from("profiles")
      .select("id, bonus_posts, full_name")
      .eq("referral_code", referralCode)
      .single();

    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Prevent self-referral
    if (referrer.id === newUserId) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Check if this user was already referred (prevent double-processing)
    const { data: existingRef } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_id", newUserId)
      .single();

    if (existingRef) {
      return NextResponse.json({ already: true });
    }

    // Record the referral
    await admin.from("referrals").insert({
      referrer_id: referrer.id,
      referral_code: referralCode,
      referred_email: email || null,
      referred_id: newUserId,
      status: "signed_up",
      bonus_posts_awarded: true,
    });

    // Award bonus posts to referrer (bilateral)
    await admin
      .from("profiles")
      .update({
        bonus_posts: (referrer.bonus_posts || 0) + BONUS_POSTS_PER_REFERRAL,
      })
      .eq("id", referrer.id);

    // Award bonus posts to invitee (bilateral) + set referred_by
    await admin
      .from("profiles")
      .update({
        referred_by: referrer.id,
        bonus_posts: BONUS_POSTS_PER_REFERRAL,
      })
      .eq("id", newUserId);

    // Notify referrer via email (non-blocking)
    try {
      const { data: referrerAuth } = await admin.auth.admin.getUserById(referrer.id);
      if (referrerAuth?.user?.email) {
        await sendReferralSuccessEmail(
          referrerAuth.user.email,
          referrer.full_name || undefined,
          email,
          BONUS_POSTS_PER_REFERRAL,
        );
      }
    } catch {
      // Email failure shouldn't block the referral
    }

    return NextResponse.json({
      success: true,
      bonusAwarded: BONUS_POSTS_PER_REFERRAL,
    });
  } catch (error) {
    console.error("Referral processing error:", error);
    return NextResponse.json({ error: "Failed to process referral" }, { status: 500 });
  }
}
