import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

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
    const { data: post, error: postError } = await (admin as any)
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Set all variants for this post to selected = false
    const { error: resetError } = await (admin as any)
      .from("post_variants")
      .update({ selected: false })
      .eq("post_id", postId);

    if (resetError) {
      console.error("Error resetting variants:", resetError);
      return NextResponse.json({ error: "Failed to update variants" }, { status: 500 });
    }

    // Set the specific variant to selected = true
    const { error: selectError } = await (admin as any)
      .from("post_variants")
      .update({ selected: true })
      .eq("id", variantId)
      .eq("post_id", postId);

    if (selectError) {
      console.error("Error selecting variant:", selectError);
      return NextResponse.json({ error: "Failed to select variant" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Variant select error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
