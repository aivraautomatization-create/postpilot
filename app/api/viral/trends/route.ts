import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase-server";
import { searchTrends } from "@/lib/perplexity";

export async function GET(req: Request) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche") || "general";
    const platform = searchParams.get("platform") || "all";

    // Fetch raw trend data from Perplexity
    const trendData = await searchTrends(niche, platform);

    if (!trendData) {
      return NextResponse.json(
        {
          error:
            "Trend research unavailable. Configure PERPLEXITY_API_KEY to enable.",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // If no Anthropic key, return raw data
    if (!anthropicKey) {
      return NextResponse.json({ raw: trendData });
    }

    // Format trend data with Claude
    const client = new Anthropic({ apiKey: anthropicKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a viral content strategist. Based on the following real-time trend data, extract and format up to 8 actionable trends into structured JSON.

Raw trend data:
${trendData}

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "trends": [
    {
      "topic": "specific trend topic or hashtag",
      "why_trending": "1-2 sentence explanation of why this is trending right now",
      "post_angle": "specific content angle or hook to use for this trend",
      "urgency": "high|medium|low",
      "platforms": ["Instagram", "TikTok"]
    }
  ]
}

Rules:
- urgency "high" = trending right now / time-sensitive
- urgency "medium" = trending this week
- urgency "low" = emerging trend
- platforms array should only include relevant platforms from: Instagram, TikTok, LinkedIn, Twitter, YouTube
- post_angle should be a specific, actionable hook idea, not generic advice
- Return up to 8 trends, sorted by urgency (high first)`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed: { trends: any[] };
    try {
      // Strip any accidental markdown fences
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: return raw perplexity data if parsing fails
      return NextResponse.json({ raw: trendData });
    }

    return NextResponse.json({
      trends: parsed.trends || [],
      niche,
      platform,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Viral trends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
