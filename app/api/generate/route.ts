import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isSubscriptionActive } from "@/lib/plan-limits";

export async function POST(req: Request) {
  try {
    const { topic, platform, profile } = await req.json();

    if (!topic || !platform) {
      return NextResponse.json({ error: "Topic and platform are required" }, { status: 400 });
    }

    // Check auth and subscription
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert social media manager and copywriter.
Your task is to write a highly engaging, viral-optimized post for ${platform}.
The user's brand profile is:
- Company Name: ${profile?.company_name || 'A growing business'}
- Niche/Industry: ${profile?.niche || 'General'}
- Offerings: ${profile?.offerings || 'Products and services'}
- Target Audience: ${profile?.target_audience || 'General public'}
- Tone of Voice: ${profile?.tone_of_voice || 'Professional yet approachable'}

Guidelines for ${platform}:
${platform === 'Twitter' ? '- Write a compelling thread (3-5 tweets). Use numbers, hooks, and spacing. Separate tweets with "---".' : ''}
${platform === 'LinkedIn' ? '- Write a professional but story-driven post. Use a strong hook, short paragraphs, and a clear call to action.' : ''}
${platform === 'TikTok' ? '- Write a short, punchy video script. Include visual cues in brackets [like this] and spoken text. Keep it under 60 seconds.' : ''}

Do not include any introductory or concluding remarks, just output the requested content.`

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Topic/Input: ${topic}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ content: response.text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
