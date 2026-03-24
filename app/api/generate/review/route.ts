import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    // Authenticate
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

    const { postId, content, platform } = await req.json();

    if (!content || !platform) {
      return NextResponse.json(
        { error: "content and platform are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an expert social media content strategist and editor. Your job is to review a post before it is published and give actionable, honest feedback.

IMPORTANT: Respond ONLY with valid JSON in this exact format — no markdown, no explanation, just raw JSON:
{
  "score": 85,
  "verdict": "Strong hook, clear CTA",
  "improvements": ["Add a question to boost comments", "Shorten first sentence"],
  "hook_rating": "A",
  "cta_rating": "B+"
}

Scoring guide:
- score: 0-100 overall publish-readiness (>75 = strong, 50-75 = needs work, <50 = needs major revision)
- verdict: one concise sentence summarising the post's biggest strength and main weakness
- improvements: 2-4 specific, actionable bullet points (start with a verb)
- hook_rating: letter grade (A, A-, B+, B, B-, C+, C, D, F) for the opening line
- cta_rating: letter grade for the call-to-action (if none, give F and note it in improvements)`,
      messages: [
        {
          role: "user",
          content: `Review this ${platform} post before publishing:\n\n${content}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI review" },
        { status: 500 }
      );
    }

    const feedback = JSON.parse(jsonMatch[0]);

    // Persist to DB if we have a postId
    if (postId) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await (admin as any)
          .from("posts")
          .update({
            ai_feedback: feedback,
            review_status: "reviewed",
          })
          .eq("id", postId)
          .eq("user_id", user.id);
      }
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Review generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate review" },
      { status: 500 }
    );
  }
}
