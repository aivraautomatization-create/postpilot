import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { searchTrends } from "@/lib/perplexity";
import { getGeminiKey } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // Rate limit: 5 per minute per user
    const { allowed, retryAfter } = checkRateLimit(`image:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    // Check subscription
    const { getSupabaseAdmin } = await import("@/lib/supabase");
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

    const { prompt, imageSize, niche, platform } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Fetch real-time visual trend data from Perplexity
    let trendContext = '';
    if (niche) {
      const trends = await searchTrends(niche, platform || 'instagram');
      if (trends) {
        trendContext = `\n\nVIRAL VISUAL TRENDS (incorporate these): ${trends}`;
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    const enhancedPrompt = `${prompt}

QUALITY DIRECTIVES: Ultra-high resolution, professional studio lighting, cinematic color grading, sharp focus, no artifacts. The image must stop the scroll — bold composition, high contrast, vibrant colors where appropriate. Anti-stock-photo aesthetic: real, raw, editorial quality.${trendContext}`;

    // Map aspect ratio from imageSize
    const aspectMap: Record<string, string> = {
      '1K': '1:1',
      '2K': '16:9',
      '4K': '16:9',
    };

    const imageModels = [
      'imagen-4.0-generate-001',
      'imagen-3.0-generate-002',
      'imagen-3.0-generate-001',
      'imagen-3.0-fast-generate-001',
    ];

    let imageUrl = null;
    let lastError = null;

    for (const modelId of imageModels) {
      try {
        const response = await ai.models.generateImages({
          model: modelId,
          prompt: enhancedPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: aspectMap[imageSize] || '1:1',
            includeRaiReason: true,
          },
        });

        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          imageUrl = `data:image/png;base64,${imageBytes}`;
          break;
        }

        // Check if filtered by safety
        const raiReason = response.generatedImages?.[0]?.raiFilteredReason;
        if (raiReason) {
          lastError = `Image filtered by safety: ${raiReason}. Try rephrasing your prompt.`;
        }
      } catch (err: any) {
        lastError = err.message || JSON.stringify(err);
        // Continue to next model
      }
    }

    if (imageUrl) {
      return NextResponse.json({ imageUrl });
    } else {
      return NextResponse.json(
        { error: lastError || "Failed to generate image. Try a different prompt." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Image generation error:", error);
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({
        error: "Generation quota exhausted. Check your Google AI Studio plan.",
        code: "QUOTA_EXHAUSTED"
      }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
