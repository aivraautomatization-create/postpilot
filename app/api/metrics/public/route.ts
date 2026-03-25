import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Cache stats for 5 minutes to avoid hitting the DB on every page load
let cachedStats: {
  postsThisMonth: number;
  postsToday: number;
  totalUsers: number;
  activeNow: number;
  timestamp: number;
} | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedStats, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ postsThisMonth: 0, postsToday: 0, totalUsers: 0, activeNow: 0 });
    }

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Parallel queries for maximum speed
    const [usageResult, usersResult, postsToday, recentActive] = await Promise.all([
      // Total posts this month
      supabase.from("usage").select("posts_count").eq("period", period),
      // Total user count
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      // Posts created today (for live social proof)
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      // Users active in last 30 minutes (approximation via recent posts/usage)
      supabase
        .from("posts")
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()),
    ]);

    const postsThisMonth = (usageResult.data || []).reduce(
      (sum: number, row: any) => sum + (row.posts_count || 0),
      0
    );

    // Unique active users in last 30 min
    const uniqueActive = new Set(
      (recentActive.data || []).map((row: any) => row.user_id)
    ).size;

    cachedStats = {
      postsThisMonth,
      postsToday: postsToday.count || 0,
      totalUsers: usersResult.count || 0,
      activeNow: uniqueActive,
      timestamp: Date.now(),
    };

    return NextResponse.json(cachedStats, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Public metrics error:", error);
    return NextResponse.json({ postsThisMonth: 0, postsToday: 0, totalUsers: 0, activeNow: 0 });
  }
}
