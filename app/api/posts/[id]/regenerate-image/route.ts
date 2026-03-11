import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndUploadPostImage } from "@/lib/ai/image";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 image regenerations per hour per user
    const rateLimitResult = rateLimit(`regenerate-image:${user.id}`, {
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Verify post belongs to user
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const admin = createAdminClient();

    const { data: post } = await admin
      .from("posts")
      .select("id, image_prompt, client_id")
      .eq("id", id)
      .eq("client_id", client.id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.image_prompt) {
      return NextResponse.json(
        { error: "No image prompt available for this post" },
        { status: 400 }
      );
    }

    // Generate and upload new image
    const imageUrl = await generateAndUploadPostImage(post.image_prompt, post.id);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image generation failed. Please try again." },
        { status: 500 }
      );
    }

    // Update post with new image URL
    await admin
      .from("posts")
      .update({ image_url: imageUrl })
      .eq("id", post.id);

    return NextResponse.json({ success: true, image_url: imageUrl });
  } catch (error) {
    console.error("Image regeneration error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate image" },
      { status: 500 }
    );
  }
}
