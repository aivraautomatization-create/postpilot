import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MAX_VIDEO_SIZE, ALLOWED_VIDEO_TYPES } from "@/lib/upload-validation";
import { getGeminiKey } from "@/lib/env";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // Rate limit: 5 per minute per user
    const { allowed, retryAfter } = checkRateLimit(`analyze:${user.id}`, 5, 60000);
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

    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    const prompt = formData.get("prompt") as string;

    if (!videoFile) {
      return NextResponse.json({ error: "Video file is required" }, { status: 400 });
    }

    // Server-side file validation
    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
      return NextResponse.json({
        error: `Invalid video format. Allowed: MP4, WebM, QuickTime`,
        code: "INVALID_FILE_TYPE"
      }, { status: 400 });
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      const maxMB = Math.round(MAX_VIDEO_SIZE / (1024 * 1024));
      return NextResponse.json({
        error: `Video too large. Maximum size: ${maxMB}MB`,
        code: "FILE_TOO_LARGE"
      }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Convert File to base64
    const arrayBuffer = await videoFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: videoFile.type,
            }
          },
          { text: prompt || "Analyze this video and provide a summary of its key points, target audience, and suggestions for social media captions." }
        ]
      }
    });

    return NextResponse.json({ content: response.text });
  } catch (error: any) {
    console.error("Video analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze video. Please try again." }, { status: 500 });
  }
}
