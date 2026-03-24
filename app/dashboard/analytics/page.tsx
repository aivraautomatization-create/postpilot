"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2, RefreshCw, BarChart2, TrendingUp, Heart, Share2, Eye, Sparkles, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";

type PostMetric = {
  id: string;
  post_id: string;
  platform: string;
  likes: number;
  shares: number;
  reach: number;
  impressions: number;
  fetched_at: string;
  posts: {
    content: string;
    published_at: string;
    platforms: string[];
  };
};

type AIInsights = {
  bestTimeToPost: { day: string; time: string; reason: string; platform: string }[];
  topContentTypes: string[];
  audienceInsights: string[];
  quickWins: string[];
};

type AggregatedMetric = {
  date: string;
  likes: number;
  shares: number;
  reach: number;
  impressions: number;
};

type PlatformMetric = {
  name: string;
  likes: number;
  shares: number;
  reach: number;
  impressions: number;
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#38bdf8",
  linkedin: "#60a5fa",
  facebook: "#818cf8",
  instagram: "#f472b6",
  tiktok: "#a78bfa",
};

const PLATFORM_DISPLAY: Record<string, string> = {
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-white/50">{label}</span>
      </div>
      <p className="text-3xl font-light text-white">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const supabase = getSupabase();

  const [metrics, setMetrics] = useState<PostMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [insightsEmpty, setInsightsEmpty] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase as any)
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
        .limit(200);

      if (fetchError) throw fetchError;
      setMetrics(data || []);
    } catch (err: any) {
      console.error("Failed to fetch metrics:", err);
      setError("Failed to load metrics. The post_metrics table may not exist yet.");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/analytics/insights");
      const data = await res.json();
      if (data.empty) {
        setInsightsEmpty(true);
        setInsights(null);
      } else if (data.bestTimeToPost) {
        setInsights(data as AIInsights);
        setInsightsEmpty(false);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!loading) {
      fetchInsights();
    }
  }, [loading, fetchInsights]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/metrics/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      if (data.synced > 0) {
        await fetchMetrics();
      }
    } catch (err: any) {
      setSyncResult({ synced: 0, errors: [err.message || "Sync failed"] });
    } finally {
      setSyncing(false);
    }
  };

  // Aggregate totals
  const totals = metrics.reduce(
    (acc, m) => ({
      likes: acc.likes + (m.likes || 0),
      shares: acc.shares + (m.shares || 0),
      reach: acc.reach + (m.reach || 0),
      impressions: acc.impressions + (m.impressions || 0),
    }),
    { likes: 0, shares: 0, reach: 0, impressions: 0 }
  );

  // Reach over time (group by date)
  const reachByDate: Record<string, AggregatedMetric> = {};
  for (const m of metrics) {
    const date = (m.posts?.published_at || m.fetched_at || "").split("T")[0];
    if (!date) continue;
    if (!reachByDate[date]) {
      reachByDate[date] = { date, likes: 0, shares: 0, reach: 0, impressions: 0 };
    }
    reachByDate[date].likes += m.likes || 0;
    reachByDate[date].shares += m.shares || 0;
    reachByDate[date].reach += m.reach || 0;
    reachByDate[date].impressions += m.impressions || 0;
  }
  const lineData: AggregatedMetric[] = Object.values(reachByDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // last 30 days

  // Platform comparison
  const platformMap: Record<string, PlatformMetric> = {};
  for (const m of metrics) {
    const name = PLATFORM_DISPLAY[m.platform] || m.platform;
    if (!platformMap[name]) {
      platformMap[name] = { name, likes: 0, shares: 0, reach: 0, impressions: 0 };
    }
    platformMap[name].likes += m.likes || 0;
    platformMap[name].shares += m.shares || 0;
    platformMap[name].reach += m.reach || 0;
    platformMap[name].impressions += m.impressions || 0;
  }
  const barData: PlatformMetric[] = Object.values(platformMap);

  // Top 5 posts by total engagement
  const postEngagementMap: Record<string, { post_id: string; content: string; platform: string; likes: number; shares: number; reach: number; total: number }> = {};
  for (const m of metrics) {
    if (!m.post_id) continue;
    if (!postEngagementMap[m.post_id]) {
      postEngagementMap[m.post_id] = {
        post_id: m.post_id,
        content: m.posts?.content || "",
        platform: m.platform,
        likes: 0,
        shares: 0,
        reach: 0,
        total: 0,
      };
    }
    postEngagementMap[m.post_id].likes += m.likes || 0;
    postEngagementMap[m.post_id].shares += m.shares || 0;
    postEngagementMap[m.post_id].reach += m.reach || 0;
    postEngagementMap[m.post_id].total += (m.likes || 0) + (m.shares || 0) + (m.reach || 0);
  }
  const topPosts = Object.values(postEngagementMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-white">Engagement Metrics</h2>
          <p className="text-white/40 text-sm mt-1">
            Real engagement data from your published posts
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh Metrics
            </>
          )}
        </button>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            syncResult.errors.length > 0
              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
              : "bg-white/5 border-white/10 text-white/70"
          }`}
        >
          {syncResult.synced > 0 ? (
            <p>Synced {syncResult.synced} metric{syncResult.synced !== 1 ? "s" : ""} successfully.</p>
          ) : (
            <p>
              No new metrics synced. Posts need platform post IDs stored at publish time for metrics
              to be fetched.
            </p>
          )}
          {syncResult.errors.length > 0 && (
            <ul className="mt-2 space-y-1 list-disc list-inside text-xs opacity-80">
              {syncResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && metrics.length === 0 && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No metrics yet</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto mb-6">
            Click "Refresh Metrics" to fetch engagement data from your connected social platforms.
            Metrics are available for posts published after platform post IDs are stored.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Metrics
          </button>
        </div>
      )}

      {/* Stats */}
      {metrics.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Heart} label="Total Likes" value={totals.likes} color="bg-pink-500/10 text-pink-400" />
            <StatCard icon={Share2} label="Total Shares" value={totals.shares} color="bg-sky-500/10 text-sky-400" />
            <StatCard icon={Eye} label="Total Reach" value={totals.reach} color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={TrendingUp} label="Impressions" value={totals.impressions} color="bg-emerald-500/10 text-emerald-400" />
          </div>

          {/* Line chart — reach over time */}
          {lineData.length > 1 && (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-base font-medium text-white mb-6">Reach Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                    name="Reach"
                  />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    name="Impressions"
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#f472b6"
                    strokeWidth={2}
                    dot={false}
                    name="Likes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar chart — platform comparison */}
          {barData.length > 0 && (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-base font-medium text-white mb-6">Platform Comparison</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }} />
                  <Bar dataKey="reach" fill="#a78bfa" name="Reach" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="likes" fill="#f472b6" name="Likes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="shares" fill="#38bdf8" name="Shares" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent metrics table */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <h3 className="text-base font-medium text-white">Recent Post Metrics</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {metrics.slice(0, 20).map((m) => (
                <div key={m.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">
                      {m.posts?.content?.slice(0, 80) || "(No content)"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                        style={{
                          backgroundColor: `${PLATFORM_COLORS[m.platform] || "#ffffff"}18`,
                          color: PLATFORM_COLORS[m.platform] || "#ffffff80",
                        }}
                      >
                        {m.platform === "twitter" ? "X" : m.platform}
                      </span>
                      {m.posts?.published_at && (
                        <span className="text-xs text-white/30">
                          {new Date(m.posts.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0 text-sm">
                    <span className="text-white/50 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-pink-400" />
                      {(m.likes || 0).toLocaleString()}
                    </span>
                    <span className="text-white/50 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      {(m.shares || 0).toLocaleString()}
                    </span>
                    <span className="text-white/50 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      {(m.reach || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section A — AI Insights */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">AI Insights</h3>
                <p className="text-xs text-white/40 mt-0.5">Personalized recommendations based on your performance data</p>
              </div>
            </div>
            <div className="p-6">
              {insightsLoading ? (
                <div className="flex items-center gap-3 text-white/40 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  Analyzing your performance data...
                </div>
              ) : insightsEmpty || !insights ? (
                <div className="border border-white/[0.06] rounded-xl p-6 text-center">
                  <Sparkles className="w-6 h-6 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/40">Post more content to unlock AI insights</p>
                </div>
              ) : (
                <div className="space-y-7">
                  {/* Best Times to Post */}
                  {insights.bestTimeToPost?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-3.5 h-3.5 text-white/30" />
                        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Best Times to Post</h4>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                        {insights.bestTimeToPost.map((slot, i) => (
                          <div
                            key={i}
                            className="shrink-0 bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 min-w-[160px]"
                          >
                            <p className="text-base font-semibold text-white">{slot.day}</p>
                            <p className="text-sm text-white/60 mt-0.5">{slot.time}</p>
                            <span
                              className="inline-block mt-2 text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                              style={{
                                backgroundColor: `${PLATFORM_COLORS[slot.platform?.toLowerCase()] || "#ffffff"}18`,
                                color: PLATFORM_COLORS[slot.platform?.toLowerCase()] || "#ffffff60",
                              }}
                            >
                              {slot.platform}
                            </span>
                            <p className="text-xs text-white/35 mt-2 leading-snug">{slot.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Content Types */}
                  {insights.topContentTypes?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Top Content Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.topContentTypes.map((type, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-white/[0.05] border border-white/[0.08] rounded-full text-sm text-white/70"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Wins */}
                  {insights.quickWins?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Quick Wins</h4>
                      <div className="space-y-2">
                        {insights.quickWins.map((win, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-white/70">{win}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section B — Top Performing Posts */}
          {topPosts.length > 0 && (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.06]">
                <h3 className="text-base font-medium text-white">Top Performing Posts</h3>
                <p className="text-xs text-white/40 mt-0.5">Ranked by total engagement (likes + shares + reach)</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {topPosts.map((post, index) => (
                  <div key={post.post_id} className="px-6 py-5 flex items-start gap-5 hover:bg-white/[0.02] transition-colors">
                    {/* Rank badge */}
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <span className="text-base font-bold text-white/70">{index + 1}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 leading-relaxed">
                        {post.content.slice(0, 80)}{post.content.length > 80 ? "…" : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                          style={{
                            backgroundColor: `${PLATFORM_COLORS[post.platform] || "#ffffff"}18`,
                            color: PLATFORM_COLORS[post.platform] || "#ffffff80",
                          }}
                        >
                          {post.platform === "twitter" ? "X" : post.platform}
                        </span>
                      </div>
                      {/* Breakdown */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          {post.likes.toLocaleString()} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-sky-400" />
                          {post.shares.toLocaleString()} shares
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-purple-400" />
                          {post.reach.toLocaleString()} reach
                        </span>
                      </div>
                    </div>

                    {/* Total engagement + link */}
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-light text-white">{post.total.toLocaleString()}</p>
                      <p className="text-xs text-white/30 mt-0.5">total</p>
                      <a
                        href={`/dashboard/posts?id=${post.post_id}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        View post
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
