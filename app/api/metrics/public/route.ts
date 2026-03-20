import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Cache stats for 5 minutes to avoid hitting the DB on every page load
let cachedStats: { postsThisMonth: number; totalUsers: number; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedStats, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    const supabase = getSupabaseAdmin() as any;
    if (!supabase) {
      return NextResponse.json({ postsThisMonth: 0, totalUsers: 0 });
    }

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get total posts this month across all users
    const { data: usageData } = await supabase
      .from("usage")
      .select("posts_count")
      .eq("period", period);

    const postsThisMonth = (usageData || []).reduce(
      (sum: number, row: any) => sum + (row.posts_count || 0),
      0
    );

    // Get total user count
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    cachedStats = {
      postsThisMonth,
      totalUsers: totalUsers || 0,
      timestamp: Date.now(),
    };

    return NextResponse.json(cachedStats, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Public metrics error:", error);
    return NextResponse.json({ postsThisMonth: 0, totalUsers: 0 });
  }
}
