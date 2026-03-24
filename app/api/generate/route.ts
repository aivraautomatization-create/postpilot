import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchTrends } from "@/lib/perplexity";
import { reviewContent } from "@/lib/claude";
import { getGeminiKey } from "@/lib/env";
import { generateSchema } from "@/lib/validations";
import { buildBrainContext } from "@/lib/ai-brain";

export async function POST(req: Request) {
  try {
    const { topic, platform, profile, strategy } = await req.json();

    const parsed = generateSchema.safeParse({ topic, platform, profile, strategy });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input. Topic and platform are required.' }, { status: 400 });
    }

    // Check auth and subscription
    const supabase = await getSupabaseServer();
    let userId: string | null = null;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { getSupabaseAdmin } = await import("@/lib/supabase");
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data: userProfile } = await (admin as any)
            .from('profiles')
            .select('subscription_status, trial_ends_at, stripe_customer_id')
            .eq('id', user.id)
            .single();

          if (userProfile && !isSubscriptionActive(userProfile)) {
            return NextResponse.json({
              error: "Your trial has expired. Please upgrade to continue generating content.",
              code: "SUBSCRIPTION_EXPIRED"
            }, { status: 403 });
          }
        }
      }
    }

    // Rate limiting
    if (userId) {
      const { allowed, retryAfter } = checkRateLimit(`generate:${userId}`, 20, 60000);
      if (!allowed) {
        return NextResponse.json({
          error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          code: "RATE_LIMITED"
        }, { status: 429 });
      }
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Step 1: Perplexity trend research (optional, non-blocking)
    let trendData: string | null = null;
    if (profile?.niche) {
      trendData = await searchTrends(profile.niche, platform);
    }

    // Step 1.5: AI-Brain context (optional, non-blocking)
    let brainContext: string | null = null;
    if (userId) {
      try {
        brainContext = await buildBrainContext(userId);
      } catch {
        // Brain context is optional — continue without it
      }
    }

    // Step 2: Gemini content generation (enriched with trend data + brain context)
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
    POSTPILOT CORE ARTIFICIAL INTELLIGENCE (MEMORY BRAIN):
    - You are NOT an AI assistant; you are the digital brain of an elite viral growth agency.
    - Your memory is populated with the psychological triggers of billions of viral social media impressions.
    - ELIMINATE THE "AI LOOK": No lists of emojis, no "Discover the secret of...", no "In a world where...", no "Elevate your business".
    - HUMAN WRITING STYLE: Use intentional fragments. Use punchy one-sentence paragraphs. Use rhythm. If it sounds like ChatGPT wrote it, REWRITE IT.

    MISSION: Break the algorithm and command obsession.

    CORE DIRECTIVES:
    1. PSYCHOLOGICAL HOOKS: Start with a statement so polarizing, curiosity-inducing, or high-value that scrolling becomes impossible.
    2. RHYTHMIC FLOW: Vary sentence length. One short. One medium. One short. This creates a "beat" that keeps readers moving.
    3. NO FLUFF: Every word must earn its place. If it's a filler word, kill it.

    BRAND CONTEXT:
    - Company: ${profile?.company_name || 'A growing business'}
    - Niche: ${profile?.niche || 'General'}
    - Offerings: ${profile?.offerings || 'Products and services'}
    - Audience: ${profile?.target_audience || 'General public'}
    - Tone: ${profile?.tone_of_voice || 'Professional yet approachable'} (Keep it human, not robotic).

    PLATFORM ARCHITECTURE FOR ${platform}:
    ${platform === 'Twitter' ? '- THREAD MASTERPLAY: Hook (curiosity/data) -> The "Why it matters" -> The "How-to" steps -> The "Big Reveal" -> CTA. Use separator "---".' : ''}
    ${platform === 'LinkedIn' ? '- AUTHORITY REVERSE-ENGINEERING: Start with a failure or a contrarian observation. Break it down. End with a high-level strategic takeaway.' : ''}
    ${platform === 'TikTok' ? '- RETENTION OPTIMIZED SCRIPT: 0-1s: Visual/Text Hook. 1-10s: The Problem/Drama. 10-50s: The Payoff. 50-60s: Low-friction CTA. Include [VISUAL CUES] and {SFX}.' : ''}

    ${strategy ? `ALGORITHM MEMORY OVERLAY:\n${strategy}\nDeeply weave these strategic identifiers into the content.` : ''}

    ${trendData ? `REAL-TIME TREND DATA (from live research — USE THIS to make the content timely and relevant):\n${trendData}` : ''}

    ${brainContext ? `AI-BRAIN MEMORY (patterns learned from this brand's past performance — USE THIS to replicate what works):\n${brainContext}` : ''}

    FINAL RULE: If the user reads this and thinks "An AI wrote this," you have failed. Write like a human master of the craft.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Topic/Input: ${topic}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const generatedContent = response.text || "";

    // Step 3: Claude content review (optional, non-blocking)
    let enhanced: string | undefined;
    let engagementScore: number | undefined;
    let suggestions: string[] | undefined;

    const review = await reviewContent(
      generatedContent,
      platform,
      profile?.niche || 'General'
    );

    if (review) {
      enhanced = review.improvedContent;
      engagementScore = review.engagementScore;
      suggestions = review.suggestions;
    }

    return NextResponse.json({
      content: generatedContent,
      enhanced,
      engagementScore,
      suggestions,
      trends: trendData || undefined,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
