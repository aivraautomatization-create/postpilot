import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGeminiKey } from "@/lib/env";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { checkRateLimitAsync } from "@/lib/rate-limit-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();

    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 per minute per user
    const { allowed, retryAfter } = await checkRateLimitAsync(`regenerate:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Check subscription
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

    // Verify post belongs to user and get current data
    const { data: post } = await admin
      .from("posts")
      .select("id, content, image_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.content) {
      return NextResponse.json(
        { error: "No content available to generate an image from" },
        { status: 400 }
      );
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const imageModels = [
      'imagen-4.0-generate-001',
      'imagen-3.0-generate-002',
      'imagen-3.0-generate-001',
      'imagen-3.0-fast-generate-001',
    ];

    let imageData: { base64: string; mimeType: string } | null = null;
    let lastError = null;

    for (const modelId of imageModels) {
      try {
        const response = await ai.models.generateImages({
          model: modelId,
          prompt: `Create a visually striking, scroll-stopping social media image for this post: ${post.content.substring(0, 500)}`,
          config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
          },
        });

        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          imageData = {
            base64: imageBytes,
            mimeType: 'image/png',
          };
          break;
        }
      } catch (err: any) {
        lastError = err.message || JSON.stringify(err);
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: `Failed to generate image: ${lastError || "Unknown error"}` },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(imageData.base64, 'base64');
    const ext = imageData.mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: imageData.mimeType,
        upsert: false,
      });

    let imageUrl: string;

    if (uploadError) {
      // Fall back to base64 data URL if storage upload fails
      imageUrl = `data:${imageData.mimeType};base64,${imageData.base64}`;
    } else {
      const { data: { publicUrl } } = admin.storage
        .from('media')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    // Update the post's image_url
    await admin
      .from("posts")
      .update({ image_url: imageUrl })
      .eq("id", id);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("Image regeneration error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate image" },
      { status: 500 }
    );
  }
}
