import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const { url, niche } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "AI analysis unavailable. Configure ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a social media strategist performing a competitor content strategy analysis. Based on the URL/handle and niche provided, generate a detailed, realistic strategy breakdown for this account.

URL/Handle: ${url}
Niche: ${niche || "general"}

Note: Infer the brand identity, audience, and likely content style from the domain name, username, or URL structure. Generate a plausible, actionable strategy breakdown as if you had analyzed their public content.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "hook_patterns": [
    "pattern description 1",
    "pattern description 2",
    "pattern description 3"
  ],
  "content_formats": [
    "Reels with text overlay",
    "Carousel tips"
  ],
  "cta_styles": [
    "DM me for X",
    "Link in bio"
  ],
  "visual_style": "Brief description of their aesthetic",
  "posting_frequency": "Nx/week",
  "engagement_tactics": [
    "Asks questions in captions",
    "Polls in stories"
  ],
  "suggested_variations": [
    {
      "hook": "A specific hook you could use based on their patterns",
      "format": "Content format (e.g. Reel, Carousel, Thread)",
      "cta": "A specific CTA that fits this style",
      "why": "Why this variation would work for your brand"
    },
    {
      "hook": "Another hook variation",
      "format": "Content format",
      "cta": "CTA",
      "why": "Why this works"
    },
    {
      "hook": "A third hook variation",
      "format": "Content format",
      "cta": "CTA",
      "why": "Why this works"
    }
  ]
}

Make the analysis specific, insightful, and directly actionable. Tailor the strategy to the ${niche || "general"} niche.`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let analysis: any;
    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      analysis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse competitor analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Competitor analyzer error:", error);
    return NextResponse.json(
      { error: "Failed to analyze competitor" },
      { status: 500 }
    );
  }
}
