import { GoogleGenAI } from "@google/genai";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { checkRateLimitAsync } from "@/lib/rate-limit-store";
import { searchTrends } from "@/lib/perplexity";
import { getGeminiKey } from "@/lib/env";
import { generateSchema } from "@/lib/validations";
import { buildBrainContext, getLatestStrategyContext } from "@/lib/ai-brain";

export const runtime = "nodejs";

/**
 * Streaming content generation endpoint.
 *
 * Architecture:
 * 1. Auth + rate limit checks (same as non-streaming)
 * 2. Perplexity + AI Brain in parallel (same)
 * 3. Gemini generateContentStream → pipe chunks via ReadableStream SSE
 * 4. Client receives text progressively, then calls /api/generate/review separately
 *
 * This gives perceived <500ms time-to-first-token vs 3-5s full wait.
 */
export async function POST(req: Request) {
  try {
    const { topic, platform, profile, strategy, journeyStage, suggestedCTAs } = await req.json();

    const parsed = generateSchema.safeParse({ topic, platform, profile, strategy });
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auth + subscription check
    const supabase = await getSupabaseServer();
    let userId: string | null = null;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { getSupabaseAdmin } = await import("@/lib/supabase");
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data: userProfile } = await admin
            .from("profiles")
            .select("subscription_status, trial_ends_at, stripe_customer_id")
            .eq("id", user.id)
            .single();

          if (userProfile && !isSubscriptionActive(userProfile)) {
            return new Response(
              JSON.stringify({ error: "Trial expired. Please upgrade.", code: "SUBSCRIPTION_EXPIRED" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // Rate limit
    if (userId) {
      const { getSupabaseAdmin: getAdmin } = await import("@/lib/supabase");
      const admin = getAdmin();
      const { allowed, retryAfter } = await checkRateLimitAsync(`generate:${userId}`, 20, 60000, admin);
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: `Rate limit exceeded. Try again in ${retryAfter}s.`, code: "RATE_LIMITED" }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parallel: trends + brain context + strategy context
    const [trendResult, brainResult, strategyResult] = await Promise.allSettled([
      profile?.niche ? searchTrends(profile.niche, platform) : Promise.resolve(null),
      userId ? buildBrainContext(userId) : Promise.resolve(null),
      userId ? getLatestStrategyContext(userId) : Promise.resolve(null),
    ]);

    const trendData = trendResult.status === "fulfilled" ? trendResult.value : null;
    const brainContext = brainResult.status === "fulfilled" ? brainResult.value : null;
    const strategyContext = strategyResult.status === "fulfilled" ? strategyResult.value : null;

    // Build system instruction (same as non-streaming route)
    const systemInstruction = `
    PULS CORE ARTIFICIAL INTELLIGENCE (MEMORY BRAIN):
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
    - Company: ${profile?.company_name || "A growing business"}
    - Niche: ${profile?.niche || "General"}
    - Offerings: ${profile?.offerings || "Products and services"}
    - Audience: ${profile?.target_audience || "General public"}
    - Tone: ${profile?.tone_of_voice || "Professional yet approachable"} (Keep it human, not robotic).

    PLATFORM ARCHITECTURE FOR ${platform}:
    ${platform === "Twitter" ? '- THREAD MASTERPLAY: Hook (curiosity/data) -> The "Why it matters" -> The "How-to" steps -> The "Big Reveal" -> CTA. Use separator "---".' : ""}
    ${platform === "LinkedIn" ? "- AUTHORITY REVERSE-ENGINEERING: Start with a failure or a contrarian observation. Break it down. End with a high-level strategic takeaway." : ""}
    ${platform === "TikTok" ? "- RETENTION OPTIMIZED SCRIPT: 0-1s: Visual/Text Hook. 1-10s: The Problem/Drama. 10-50s: The Payoff. 50-60s: Low-friction CTA. Include [VISUAL CUES] and {SFX}." : ""}

    ${strategy ? `ALGORITHM MEMORY OVERLAY:\n${strategy}\nDeeply weave these strategic identifiers into the content.` : ""}

    ${trendData ? `REAL-TIME TREND DATA (from live research — USE THIS to make the content timely and relevant):\n${trendData}` : ""}

    ${brainContext ? `AI-BRAIN MEMORY (patterns learned from this brand's past performance — USE THIS to replicate what works):\n${brainContext}` : ""}

    ${strategyContext ? `RECENT STRATEGY INSIGHTS (AI-generated recommendations from post performance analysis — APPLY THESE):\n${strategyContext}` : ""}

    ${journeyStage ? `\nContent Journey Stage: ${journeyStage}. ${(suggestedCTAs as string[] | undefined)?.length ? `Suggested CTAs to consider: ${(suggestedCTAs as string[]).join(", ")}` : ""}` : ""}

    FINAL RULE: If the user reads this and thinks "An AI wrote this," you have failed. Write like a human master of the craft.
    `.trim();

    // Stream via Gemini
    const ai = new GoogleGenAI({ apiKey });

    const stream = await ai.models.generateContentStream({
      model: "gemini-3.1-pro-preview",
      contents: `Topic/Input: ${topic}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Convert Gemini async generator → Web ReadableStream (SSE)
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text || "";
            if (text) {
              // SSE format: data lines
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          // Signal completion with trend data
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, trends: trendData || undefined })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Streaming generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate content" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
