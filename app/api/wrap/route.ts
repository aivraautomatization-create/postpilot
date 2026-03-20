import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const defaultMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    const month = searchParams.get("month") || defaultMonth;

    const [year, mo] = month.split("-").map(Number);
    const startDate = new Date(year, mo - 1, 1).toISOString();
    const endDate = new Date(year, mo, 1).toISOString();

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: posts } = await (admin as any)
      .from("posts")
      .select("id, content, platforms, image_url, published_at")
      .eq("user_id", user.id)
      .eq("status", "published")
      .gte("published_at", startDate)
      .lt("published_at", endDate);

    const publishedPosts = posts || [];
    const postIds = publishedPosts.map((p: any) => p.id);

    const platformSet = new Set<string>();
    const platformCounts: Record<string, number> = {};
    for (const post of publishedPosts) {
      for (const p of post.platforms || []) {
        platformSet.add(p);
        platformCounts[p] = (platformCounts[p] || 0) + 1;
      }
    }

    let metrics: any[] = [];
    if (postIds.length > 0) {
      const { data: metricsData } = await (admin as any)
        .from("post_metrics")
        .select("post_id, platform, likes, shares, reach, impressions")
        .in("post_id", postIds);
      metrics = metricsData || [];
    }

    const totalEngagement = metrics.reduce(
      (sum: number, m: any) => sum + (m.likes || 0) + (m.shares || 0),
      0
    );

    const engagementByPost: Record<string, number> = {};
    for (const m of metrics) {
      engagementByPost[m.post_id] = (engagementByPost[m.post_id] || 0) + (m.likes || 0) + (m.shares || 0);
    }

    let topPost: any = null;
    if (Object.keys(engagementByPost).length > 0) {
      const topPostId = Object.entries(engagementByPost).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      const found = publishedPosts.find((p: any) => p.id === topPostId);
      if (found) {
        topPost = {
          content: found.content?.slice(0, 280) || "",
          platforms: found.platforms,
          engagement: engagementByPost[topPostId],
          image_url: found.image_url,
        };
      }
    }

    const timeSavedMinutes = publishedPosts.length * 15;
    const timeSavedFormatted =
      timeSavedMinutes >= 60
        ? `${Math.floor(timeSavedMinutes / 60)}h ${timeSavedMinutes % 60}m`
        : `${timeSavedMinutes}m`;

    return NextResponse.json({
      month,
      totalPosts: publishedPosts.length,
      totalPlatforms: platformSet.size,
      platforms: Array.from(platformSet),
      platformBreakdown: platformCounts,
      totalEngagement,
      timeSaved: timeSavedFormatted,
      timeSavedMinutes,
      topPost,
    });
  } catch (error) {
    console.error("Wrap API error:", error);
    return NextResponse.json({ error: "Failed to generate wrap" }, { status: 500 });
  }
}
