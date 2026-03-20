import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin() as any;
    if (!admin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Get usage data by period (month)
    const { data: usageData } = await admin
      .from("usage")
      .select("period, posts_count")
      .eq("user_id", user.id)
      .order("period", { ascending: true });

    // Get posts with their metrics grouped by month
    const { data: posts } = await admin
      .from("posts")
      .select("id, published_at, status")
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("published_at", { ascending: true });

    if (!posts || posts.length === 0) {
      return NextResponse.json({ timeline: [] });
    }

    // Get all post metrics
    const postIds = posts.map((p: any) => p.id);
    const { data: metrics } = await admin
      .from("post_metrics")
      .select("post_id, likes, shares, reach")
      .in("post_id", postIds);

    // Build metrics lookup
    const metricsMap = new Map<string, { likes: number; shares: number; reach: number }>();
    for (const m of (metrics || [])) {
      const existing = metricsMap.get(m.post_id) || { likes: 0, shares: 0, reach: 0 };
      metricsMap.set(m.post_id, {
        likes: existing.likes + (m.likes || 0),
        shares: existing.shares + (m.shares || 0),
        reach: existing.reach + (m.reach || 0),
      });
    }

    // Group posts by month and compute avg engagement
    const monthlyData = new Map<string, { postCount: number; totalEngagement: number; totalReach: number }>();

    for (const post of posts) {
      if (!post.published_at) continue;
      const date = new Date(post.published_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthlyData.get(month) || { postCount: 0, totalEngagement: 0, totalReach: 0 };
      const postMetrics = metricsMap.get(post.id) || { likes: 0, shares: 0, reach: 0 };

      existing.postCount++;
      existing.totalEngagement += postMetrics.likes + postMetrics.shares;
      existing.totalReach += postMetrics.reach;
      monthlyData.set(month, existing);
    }

    // Build timeline with milestones
    const milestoneLabels = [
      "Getting started",
      "Finding your voice",
      "Building momentum",
      "Hitting your stride",
      "Growing consistently",
      "Scaling up",
    ];

    const timeline = Array.from(monthlyData.entries()).map(([month, data], idx) => {
      const avgEngagement = data.postCount > 0 ? Math.round((data.totalEngagement / data.postCount) * 10) / 10 : 0;
      const avgReach = data.postCount > 0 ? Math.round(data.totalReach / data.postCount) : 0;

      return {
        month,
        label: milestoneLabels[Math.min(idx, milestoneLabels.length - 1)],
        postsPublished: data.postCount,
        avgEngagement,
        avgReach,
        totalEngagement: data.totalEngagement,
      };
    });

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}
