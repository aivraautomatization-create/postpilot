import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchTrends } from "@/lib/perplexity";
import { getGeminiKey } from "@/lib/env";
import { isSubscriptionActive } from "@/lib/plan-limits";

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
    const { allowed, retryAfter } = checkRateLimit(`strategy:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: userProfile } = await (admin as any)
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

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Analyze the following company profile and architect a high-leverage viral social media strategy.

    Company: ${profile.companyName || profile.company_name}
    Niche: ${profile.niche}
    Offerings: ${profile.offerings}
    Audience: ${profile.targetAudience || profile.target_audience}
    Voice: ${profile.toneOfVoice || profile.tone_of_voice}

    ${trendData ? `REAL-TIME TREND INTELLIGENCE (live data — incorporate this into your strategy):\n${trendData}\n` : ''}

    Output a masterplay strategy using exactly these sections in markdown:

    ## Trend-Jacking & Topic Dominance
    Identify 3 hyper-specific content pillars that are currently "breaking" the algorithm in this niche. Focus on contrarian takes, mystery, or high-urgency value.${trendData ? ' USE the real-time trend data above to ground your recommendations in what is actually trending RIGHT NOW.' : ''}

    ## Algorithmic Timing & Surge Windows
    Map out a 7-day surge window. Provide specific times based on psychological scrolling patterns for this exact audience.

    ## Viral Production & Perfection
    Detail 3 specific editing "hooks" (visual shifts, audio patterns, or framing) that maximize retention. Explain exactly how to "perfect" the edit to look high-end and anti-static.

    ## The Multiplier Effect
    Provide 2 "unconventional" growth loops or engagement hacks (e.g., specific comment-pinning strategies or cross-platform bridge techniques) to force virality.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite social media strategist and algorithm expert. Provide highly actionable, data-driven, and specific advice tailored to the exact niche and audience provided. Do not give generic advice."
      }
    });

    return NextResponse.json({ content: response.text });
  } catch (error: any) {
    console.error("Strategy generation error:", error);
    return NextResponse.json({ error: "Failed to generate strategy" }, { status: 500 });
  }
}
