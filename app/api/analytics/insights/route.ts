import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Server unavailable" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server unavailable" }, { status: 500 });
  }

  const [metricsResult, brandMemoryResult] = await Promise.all([
    (admin as any)
      .from("post_metrics")
      .select(
        `
        id,
        post_id,
        platform,
        likes,
        shares,
        reach,
        impressions,
        fetched_at,
        posts!inner (
          content,
          published_at,
          platforms
        )
      `
      )
      .eq("posts.user_id", user.id)
      .order("fetched_at", { ascending: false })
      .limit(200),
    (admin as any)
      .from("brand_memory")
      .select("*")
      .eq("user_id", user.id)
      .order("performance_score", { ascending: false })
      .limit(20),
  ]);

  const metrics = metricsResult.data || [];
  const brandMemory = brandMemoryResult.data || [];

  if (metrics.length === 0) {
    return NextResponse.json({
      empty: true,
      message: "Post more content to unlock AI insights",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }

  // Build a concise summary for Claude
  const metricsSummary = metrics.slice(0, 50).map((m: any) => ({
    platform: m.platform,
    likes: m.likes || 0,
    shares: m.shares || 0,
    reach: m.reach || 0,
    impressions: m.impressions || 0,
    content: m.posts?.content?.slice(0, 120) || "",
    published_at: m.posts?.published_at || m.fetched_at || "",
  }));

  const brandMemorySummary = brandMemory.slice(0, 10).map((b: any) => ({
    pattern_type: b.pattern_type,
    pattern_value: b.pattern_value,
    performance_score: b.performance_score,
    platform: b.platform,
  }));

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: `You are an expert social media analytics advisor. Analyze user performance data and return actionable insights as JSON only.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "bestTimeToPost": [
    { "day": "Tuesday", "time": "9:00 AM", "reason": "Highest engagement in your data", "platform": "LinkedIn" }
  ],
  "topContentTypes": ["Carousels", "Questions", "How-to posts"],
  "audienceInsights": ["Your audience engages most with educational content", "Posts with questions get 3x more comments"],
  "quickWins": ["Post on Tuesday mornings for LinkedIn", "Add a question to every Instagram caption"]
}

Rules:
- bestTimeToPost: 2-4 entries, derive from published_at timestamps and engagement data
- topContentTypes: 3-5 content types inferred from content patterns
- audienceInsights: 2-4 specific insights grounded in the data
- quickWins: 3-5 short, actionable tips (imperative verb, under 12 words each)
- Be specific and data-driven, not generic`,
      messages: [
        {
          role: "user",
          content: `Analyze my social media performance data and return AI insights.

POST METRICS (${metricsSummary.length} records):
${JSON.stringify(metricsSummary, null, 2)}

BRAND MEMORY / WINNING PATTERNS (${brandMemorySummary.length} records):
${JSON.stringify(brandMemorySummary, null, 2)}

Return the JSON insights object.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const insights = JSON.parse(jsonMatch[0]);
    return NextResponse.json(insights);
  } catch (err) {
    console.error("Analytics insights AI error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
