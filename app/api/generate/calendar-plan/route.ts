import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { searchTrends } from "@/lib/perplexity";
import { getGeminiKey } from "@/lib/env";

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

    // Check subscription
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

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

    const { profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Company profile is required" }, { status: 400 });
    }

    const { niche, industry, goals, targetAudience, toneOfVoice, companyName } = profile;

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Step 1: Perplexity trend research
    const trendData = await searchTrends(niche || industry || 'General', 'all platforms');

    // Step 2: Gemini calendar generation
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Generate a 30-day social media content calendar for the following brand.

BRAND:
- Company: ${companyName || 'A growing business'}
- Niche: ${niche || 'General'}
- Industry: ${industry || 'General'}
- Goals: ${goals || 'Grow audience and engagement'}
- Target Audience: ${targetAudience || 'General public'}
- Tone of Voice: ${toneOfVoice || 'Professional yet approachable'}

${trendData ? `REAL-TIME TREND DATA (incorporate into content topics):\n${trendData}\n` : ''}

You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text). Use this exact structure — an array of 30 objects:

[
  {
    "day": 1,
    "platform": "Instagram" | "Twitter" | "LinkedIn" | "TikTok" | "Facebook" | "YouTube",
    "format": "carousel" | "reel" | "thread" | "story" | "post" | "video" | "poll" | "live",
    "topic": "Specific topic title",
    "hook": "The opening hook line",
    "caption": "Full post caption/script (2-4 sentences)",
    "cta": "Call to action text",
    "journeyStage": "awareness" | "consideration" | "conversion" | "retention"
  }
]

Requirements:
- Spread across multiple platforms (at least 3 different platforms)
- Mix of formats appropriate to each platform
- Cover all 4 journey stages across the month
- Make hooks scroll-stopping and non-generic
- CTAs should be varied and platform-appropriate
- Topics should be specific and timely, not generic filler
${trendData ? '- USE the real-time trend data to ground topics in what is actually trending NOW' : ''}
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite social media strategist. You ALWAYS respond with valid JSON only — no markdown fences, no extra text. Generate highly actionable, specific content calendars tailored to the brand.",
        temperature: 0.7,
      }
    });

    const rawText = response.text || "";
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let calendar;
    try {
      calendar = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse calendar data" }, { status: 500 });
    }

    if (!Array.isArray(calendar)) {
      return NextResponse.json({ error: "Invalid calendar format" }, { status: 500 });
    }

    // Step 3: Save each item as a draft post
    const today = new Date();
    const postsToInsert = calendar.map((item: {
      day: number;
      platform: string;
      format: string;
      topic: string;
      hook: string;
      caption: string;
      cta: string;
      journeyStage: string;
    }) => {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + (item.day - 1));

      return {
        user_id: user.id,
        content: `${item.hook}\n\n${item.caption}\n\n${item.cta}`,
        platforms: [item.platform],
        status: 'draft',
        scheduled_at: scheduledDate.toISOString(),
        metadata: {
          format: item.format,
          topic: item.topic,
          hook: item.hook,
          cta: item.cta,
          journeyStage: item.journeyStage,
          source: 'calendar-plan',
        },
      };
    });

    const { error: insertError } = await (admin as any)
      .from('posts')
      .insert(postsToInsert);

    if (insertError) {
      console.error("Failed to save calendar posts:", insertError);
      // Still return the calendar even if save fails
      return NextResponse.json({
        calendar,
        postsCreated: 0,
        warning: "Calendar generated but failed to save posts as drafts.",
      });
    }

    return NextResponse.json({
      calendar,
      postsCreated: postsToInsert.length,
    });
  } catch (error) {
    console.error("Calendar plan generation error:", error);
    return NextResponse.json({ error: "Failed to generate calendar plan" }, { status: 500 });
  }
}
