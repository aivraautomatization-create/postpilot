import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Records a variant selection as an explicit learning signal for the AI Brain.
 *
 * Psychology: Explicit preference (choosing A over B+C) is ~10x stronger signal
 * than passive engagement. We store both winners (high score) and losers (low score)
 * so the brain learns what to avoid as much as what to repeat.
 */
async function learnFromVariantSelection(
  admin: SupabaseClient,
  userId: string,
  postId: string,
  selectedVariantId: string
): Promise<void> {
  try {
    // Fetch all variants for this post
    const { data: variants } = await admin
      .from("post_variants")
      .select("id, hook, cta, variant_label, content")
      .eq("post_id", postId);

    if (!variants || variants.length === 0) return;

    const selected = variants.find((v: any) => v.id === selectedVariantId);
    if (!selected) return;

    const rejected = variants.filter((v: any) => v.id !== selectedVariantId);

    const entries: Array<{
      user_id: string;
      memory_type: string;
      content: Record<string, unknown>;
      performance_score: number;
      source_post_id: string;
    }> = [];

    // Winning hook — high score (explicit human preference)
    if (selected.hook) {
      entries.push({
        user_id: userId,
        memory_type: "winning_hook",
        content: {
          hook: selected.hook,
          cta: selected.cta || null,
          label: selected.variant_label,
          description: `Preferred over ${rejected.length} other variant(s)`,
          example: (selected.content as string)?.slice(0, 120) || "",
        },
        performance_score: 0.9,
        source_post_id: postId,
      });
    }

    // Winning CTA — high score
    if (selected.cta) {
      entries.push({
        user_id: userId,
        memory_type: "cta_pattern",
        content: {
          text: selected.cta,
          hook: selected.hook || null,
          description: "CTA style from preferred variant",
        },
        performance_score: 0.85,
        source_post_id: postId,
      });
    }

    // Rejected hooks — low score (explicit dispreference)
    for (const v of rejected) {
      if (v.hook) {
        entries.push({
          user_id: userId,
          memory_type: "winning_hook",
          content: {
            hook: v.hook,
            cta: v.cta || null,
            label: v.variant_label,
            description: "Rejected — user chose a different variant",
          },
          performance_score: 0.2,
          source_post_id: postId,
        });
      }
    }

    if (entries.length > 0) {
      await admin.from("brand_memory").insert(entries);
    }
  } catch (err) {
    // Non-critical — don't fail the selection request
    console.error("[variant-select] learnFromVariantSelection failed:", err);
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: postId, variantId } = await params;
    const supabase = await getSupabaseServer();

    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Verify the post belongs to the authenticated user
    const { data: post, error: postError } = await admin
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Set all variants for this post to selected = false
    const { error: resetError } = await admin
      .from("post_variants")
      .update({ selected: false })
      .eq("post_id", postId);

    if (resetError) {
      console.error("Error resetting variants:", resetError);
      return NextResponse.json({ error: "Failed to update variants" }, { status: 500 });
    }

    // Set the specific variant to selected = true
    const { error: selectError } = await admin
      .from("post_variants")
      .update({ selected: true })
      .eq("id", variantId)
      .eq("post_id", postId);

    if (selectError) {
      console.error("Error selecting variant:", selectError);
      return NextResponse.json({ error: "Failed to select variant" }, { status: 500 });
    }

    // Feed selection into AI Brain (fire-and-forget — don't block the response)
    learnFromVariantSelection(admin, user.id, postId, variantId).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Variant select error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
