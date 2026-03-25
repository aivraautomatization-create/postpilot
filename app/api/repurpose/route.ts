import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSubscriptionActive } from "@/lib/plan-limits";

export async function POST(req: Request) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Subscription check ───────────────────────────────────────────────────
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: profile } = await admin
        .from("profiles")
        .select("subscription_status, trial_ends_at, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile && !isSubscriptionActive(profile)) {
        return NextResponse.json(
          {
            error:
              "Your trial has expired. Please upgrade to continue using content repurposing.",
            code: "SUBSCRIPTION_EXPIRED",
          },
          { status: 403 }
        );
      }
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    const body = await req.json();
    const { content, sourceType, targetPlatforms, tone } = body as {
      content: string;
      sourceType: "blog" | "transcript" | "script" | "tweet" | "linkedin";
      targetPlatforms: string[];
      tone?: string;
    };

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!targetPlatforms || targetPlatforms.length === 0) {
      return NextResponse.json(
        { error: "At least one target platform is required" },
        { status: 400 }
      );
    }

    // ── Build prompt ─────────────────────────────────────────────────────────
    const sourceTypeLabel =
      sourceType === "blog"
        ? "blog post"
        : sourceType === "transcript"
        ? "video transcript"
        : sourceType === "script"
        ? "podcast script"
        : sourceType === "tweet"
        ? "tweet"
        : "LinkedIn article";

    const toneInstruction = tone
      ? `Use a ${tone} tone throughout.`
      : "Match the original content's tone.";

    const platformList = targetPlatforms.join(", ");

    const prompt = `You are a social media repurposing expert. Take this ${sourceTypeLabel} content and repurpose it into multiple platform-specific posts. ${toneInstruction} Return ONLY valid JSON with no markdown:
{
  "posts": [
    {
      "platform": "Instagram",
      "format": "carousel|reel|post|story",
      "hook": "The opening line",
      "content": "Full post text",
      "cta": "Call to action",
      "hashtags": ["tag1", "tag2"],
      "tips": "Platform-specific tip for this post"
    }
  ]
}
Generate one post per requested platform (${platformList}), optimized for that platform's best practices. Make hooks scroll-stopping and unique per platform.

Here is the ${sourceTypeLabel} content to repurpose:

${content}`;

    // ── Call Claude ──────────────────────────────────────────────────────────
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed: { posts: Array<Record<string, unknown>> };
    try {
      // Strip any accidental markdown code fences
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    const posts = parsed.posts || [];

    // ── Save drafts ──────────────────────────────────────────────────────────
    let savedCount = 0;

    if (admin && posts.length > 0) {
      const inserts = posts.map((post: Record<string, unknown>) => ({
        user_id: user.id,
        content: post.content as string,
        platforms: [post.platform as string],
        status: "draft",
        metadata: {
          source: "repurpose",
          format: post.format,
          hook: post.hook,
          cta: post.cta,
          hashtags: post.hashtags,
          sourceType,
          tone: tone || null,
        },
      }));

      const { data: saved, error: saveError } = await admin
        .from("posts")
        .insert(inserts)
        .select();

      if (!saveError && saved) {
        savedCount = saved.length;
      }
    }

    return NextResponse.json({ posts, savedCount });
  } catch (err) {
    console.error("[repurpose] error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
