import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type MetricWithPost = {
  post_id: string | null
  platform: string
  likes: number | null
  shares: number | null
  reach: number | null
  fetched_at: string | null
  posts: { user_id: string; published_at: string | null } | null
}

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

  const [postsResult, profileResult, metricsResult] = await Promise.all([
    admin
      .from("posts")
      .select("id, published_at, platforms, status")
      .eq("user_id", user.id)
      .eq("status", "published"),
    admin
      .from("profiles")
      .select("tone_of_voice, niche")
      .eq("id", user.id)
      .single(),
    admin
      .from("post_metrics")
      .select("post_id, platform, likes, shares, reach, fetched_at, posts!inner(user_id, published_at)")
      .eq("posts.user_id", user.id),
  ]);

  const posts = postsResult.data || [];
  const profile = profileResult.data;
  const metrics = (metricsResult.data || []) as unknown as MetricWithPost[];

  const postsAnalyzed = posts.length;
  const confidenceScore = Math.min(100, postsAnalyzed * 2);

  // Best performing day
  const dayEngagement: Record<number, { total: number; count: number }> = {};
  for (const m of metrics) {
    const publishedAt = m.posts?.published_at;
    if (!publishedAt) continue;
    const day = new Date(publishedAt).getDay();
    if (!dayEngagement[day]) dayEngagement[day] = { total: 0, count: 0 };
    dayEngagement[day].total += (m.likes || 0) + (m.shares || 0);
    dayEngagement[day].count += 1;
  }

  let bestDay: string | null = null;
  let bestDayAvg = 0;
  for (const [day, data] of Object.entries(dayEngagement)) {
    const avg = data.total / data.count;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDay = DAY_NAMES[Number(day)];
    }
  }

  // Best performing platform
  const platformEngagement: Record<string, { total: number; count: number }> = {};
  for (const m of metrics) {
    if (!platformEngagement[m.platform]) platformEngagement[m.platform] = { total: 0, count: 0 };
    platformEngagement[m.platform].total += (m.likes || 0) + (m.shares || 0);
    platformEngagement[m.platform].count += 1;
  }

  let bestPlatform: string | null = null;
  let bestPlatformAvg = 0;
  for (const [platform, data] of Object.entries(platformEngagement)) {
    const avg = data.total / data.count;
    if (avg > bestPlatformAvg) {
      bestPlatformAvg = avg;
      bestPlatform = platform;
    }
  }

  // Engagement trend — last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyEngagement: Record<string, { total: number; count: number }> = {};

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyEngagement[key] = { total: 0, count: 0 };
  }

  for (const m of metrics) {
    const publishedAt = m.posts?.published_at;
    if (!publishedAt) continue;
    const d = new Date(publishedAt);
    if (d < sixMonthsAgo) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyEngagement[key]) {
      monthlyEngagement[key].total += (m.likes || 0) + (m.shares || 0);
      monthlyEngagement[key].count += 1;
    }
  }

  const engagementTrend = Object.entries(monthlyEngagement)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      avgEngagement: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }));

  return NextResponse.json({
    postsAnalyzed,
    confidenceScore,
    bestDay,
    bestPlatform,
    engagementTrend,
    voiceProfile: {
      toneOfVoice: profile?.tone_of_voice || null,
      niche: profile?.niche || null,
    },
  });
}
