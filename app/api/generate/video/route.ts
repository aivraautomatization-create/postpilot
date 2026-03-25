import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { searchTrends } from "@/lib/perplexity";
import { getGeminiKey } from "@/lib/env";
import { checkRateLimitAsync } from "@/lib/rate-limit-store";

async function downloadVideoWithKey(videoUri: string, apiKey: string): Promise<Buffer | null> {
  try {
    const downloadUrl = `${videoUri}&key=${apiKey}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      console.error("Failed to download video from Veo:", response.status, response.statusText);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    console.error("Failed to download video:", err);
    return null;
  }
}

async function uploadToSupabaseStorage(videoBuffer: Buffer, userId: string): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return null;

    const fileName = `${userId}/${crypto.randomUUID()}.mp4`;

    const { error } = await admin!.storage
      .from('media')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      return null;
    }

    const { data: { publicUrl } } = admin!.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("Failed to upload video to storage:", err);
    return null;
  }
}

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

    // Rate limit: 3 per minute per user (expensive operation)
    const { allowed, retryAfter } = await checkRateLimitAsync(`video:${user.id}`, 3, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: profile } = await admin
        .from('profiles')
        .select('subscription_status, trial_ends_at, stripe_customer_id, subscription_tier')
        .eq('id', user.id)
        .single();
      if (profile && !isSubscriptionActive(profile)) {
        return NextResponse.json({
          error: "Your trial has expired. Please upgrade to continue.",
          code: "SUBSCRIPTION_EXPIRED"
        }, { status: 403 });
      }
      const tier = profile?.subscription_tier;
      if (tier !== 'tier-pro' && tier !== 'tier-business') {
        return NextResponse.json({
          error: "Video generation requires Pro or Business plan.",
          code: "TIER_RESTRICTED"
        }, { status: 403 });
      }
    }

    const { prompt, aspectRatio, strategy, niche, platform } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Fetch real-time trend data from Perplexity for viral video optimization
    let trendContext = '';
    if (niche) {
      const trends = await searchTrends(niche, platform || 'tiktok');
      if (trends) {
        trendContext = `\nREAL-TIME VIRAL TRENDS (weave these into the video style):\n${trends}\n`;
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    const videoPrompt = `${prompt}

VIDEO QUALITY DIRECTIVES:
- STYLE: Ultra-high quality cinematic rendering, perfect studio lighting and color grading.
- MOTION: High-retention editing style, dynamic camera movements, smooth rhythmic pacing.
- HOOK: Visually arresting opening within the first 0.8 seconds to beat the algorithm.
- ALGORITHM OPTIMIZATION: Bold colors, high contrast, ultra-sharp focus, maximum visual impact.
- EDITING: Professional pacing, no static shots, constant engaging micro-movements.
- REALISM: Hyper-realistic textures, natural physics, organic fluid movements. No AI artifacts.
${strategy ? `\nSTRATEGY OVERLAY:\n${strategy}\n` : ''}${trendContext}`.trim();

    const videoModels = [
      'veo-3.0-generate-001',
      'veo-3.0-fast-generate-001',
      'veo-2.0-generate-001',
    ];

    let operation = null;
    let lastVideoError = null;

    for (const modelId of videoModels) {
      try {
        const videoConfig: any = {
            numberOfVideos: 1,
            aspectRatio: aspectRatio || '9:16',
        };
        // personGeneration only supported on Veo 2.0
        if (modelId.includes('veo-2')) {
          videoConfig.personGeneration = 'allow_adult';
        }
        operation = await ai.models.generateVideos({
          model: modelId,
          prompt: videoPrompt,
          config: videoConfig,
        });
        if (operation) {
          console.log(`Video generation started with model: ${modelId}`);
          break;
        }
      } catch (err: any) {
        lastVideoError = err.message || JSON.stringify(err);
        console.warn(`Model ${modelId} failed:`, lastVideoError);
      }
    }

    if (!operation) {
      return NextResponse.json(
        { error: `Failed to start video generation: ${lastVideoError}` },
        { status: 500 }
      );
    }

    // Poll for completion (10s intervals as recommended by SDK docs)
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const generatedVideo = operation.response?.generatedVideos?.[0];
    const videoUri = generatedVideo?.video?.uri;

    if (!videoUri) {
      console.error("Video generation failed. Operation:", JSON.stringify({
        done: operation.done,
        error: operation.error,
        response: operation.response,
      }, null, 2));
      const errorMsg = operation.error?.message
        || "Video generation failed. The model may be temporarily unavailable — please try again.";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    // Download video server-side (API key never sent to client)
    const videoBuffer = await downloadVideoWithKey(videoUri, apiKey);
    if (!videoBuffer) {
      return NextResponse.json({ error: "Failed to download generated video. Please try again." }, { status: 500 });
    }

    // Upload to Supabase Storage for permanent URL
    const permanentUrl = await uploadToSupabaseStorage(videoBuffer, user.id);

    if (permanentUrl) {
      return NextResponse.json({ videoUrl: permanentUrl });
    } else {
      return NextResponse.json({ error: "Failed to store video. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Video generation error:", error);
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({
        error: "Generation quota exhausted. Check your Google AI Studio plan.",
        code: "QUOTA_EXHAUSTED"
      }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 });
  }
}
