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
import { Loader2, RefreshCw, BarChart2, TrendingUp, Heart, Share2, Eye } from "lucide-react";
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

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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
        </>
      )}
    </div>
  );
}
