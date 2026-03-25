import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimitAsync } from "@/lib/rate-limit-store";
import { searchTrends } from "@/lib/perplexity";
import { getGeminiKey } from "@/lib/env";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { buildBrainContext } from "@/lib/ai-brain";

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

    // Rate limit: 5 per minute
    const { allowed, retryAfter } = await checkRateLimitAsync(`strategy:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (admin) {
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
    }

    const { profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Company profile is required" }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Fetch real-time trend data from Perplexity
    const niche = profile.niche || profile.companyName || 'General';
    const trendData = await searchTrends(niche, 'all platforms');

    // Fetch AI-Brain context (optional)
    let brainContext: string | null = null;
    try {
      brainContext = await buildBrainContext(user.id);
    } catch {
      // Brain context is optional
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Analyze the following company profile and architect a high-leverage viral social media strategy.

    Company: ${profile.companyName || profile.company_name}
    Niche: ${profile.niche}
    Offerings: ${profile.offerings}
    Audience: ${profile.targetAudience || profile.target_audience}
    Voice: ${profile.toneOfVoice || profile.tone_of_voice}

    ${trendData ? `REAL-TIME TREND INTELLIGENCE (live data — incorporate this into your strategy):\n${trendData}\n` : ''}

    You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text). Use this exact structure:

    {
      "pillars": [
        {
          "title": "Pillar name",
          "description": "1-2 sentence description of this content pillar",
          "color": "purple" | "blue" | "amber" | "emerald",
          "topics": ["Topic 1", "Topic 2", "Topic 3"]
        }
      ],
      "platforms": [
        {
          "name": "Platform Name",
          "icon": "twitter" | "linkedin" | "tiktok" | "instagram" | "facebook" | "youtube",
          "tips": ["Tip 1", "Tip 2", "Tip 3"],
          "bestTimes": "e.g. Tue/Thu 8-9am, Sat 11am",
          "contentType": "e.g. Carousel posts, Thread hooks"
        }
      ],
      "weeklySchedule": [
        { "day": "Monday", "focus": "What to post", "platform": "Primary platform" },
        { "day": "Tuesday", "focus": "What to post", "platform": "Primary platform" },
        { "day": "Wednesday", "focus": "What to post", "platform": "Primary platform" },
        { "day": "Thursday", "focus": "What to post", "platform": "Primary platform" },
        { "day": "Friday", "focus": "What to post", "platform": "Primary platform" }
      ],
      "multiplierHacks": [
        { "title": "Hack name", "description": "Detailed description of the growth hack" }
      ],
      "fullStrategy": "Full markdown strategy text for saving to profile"
    }

    Requirements:
    - Provide exactly 3-4 pillars with different colors (purple, blue, amber, emerald)
    - Provide platform advice for at least 3 relevant platforms
    - Each platform should have 3-4 actionable tips
    - Weekly schedule should cover 5 weekdays
    - 2-3 multiplier hacks
    - fullStrategy should be a comprehensive markdown version of the entire strategy
    ${trendData ? '- USE the real-time trend data to ground recommendations in what is actually trending RIGHT NOW.' : ''}
    ${brainContext ? `\n\nAI-BRAIN MEMORY (patterns learned from past performance — factor these into your strategy):\n${brainContext}` : ''}
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite social media strategist and algorithm expert. You ALWAYS respond with valid JSON only — no markdown fences, no extra text. Provide highly actionable, data-driven, and specific advice tailored to the exact niche and audience provided. Do not give generic advice."
      }
    });

    const rawText = response.text || "";

    // Try to parse structured JSON
    let structured = null;
    try {
      // Strip potential markdown code fences
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      structured = JSON.parse(cleaned);
    } catch {
      // Fallback: return as markdown content
      return NextResponse.json({ content: rawText, structured: null });
    }

    return NextResponse.json({
      content: structured.fullStrategy || rawText,
      structured: {
        pillars: structured.pillars || [],
        platforms: structured.platforms || [],
        weeklySchedule: structured.weeklySchedule || [],
        multiplierHacks: structured.multiplierHacks || [],
      }
    });
  } catch (error: any) {
    console.error("Strategy generation error:", error);
    return NextResponse.json({ error: "Failed to generate strategy" }, { status: 500 });
  }
}
