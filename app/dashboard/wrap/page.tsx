"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Gift,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Heart,
  Globe,
  Clock,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

type WrapData = {
  month: string;
  totalPosts: number;
  totalPlatforms: number;
  platforms: string[];
  platformBreakdown: Record<string, number>;
  totalEngagement: number;
  timeSaved: string;
  timeSavedMinutes: number;
  topPost: {
    content: string;
    platforms: string[];
    engagement: number;
    image_url: string | null;
  } | null;
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  linkedin: "bg-blue-500/10 text-blue-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  instagram: "bg-pink-500/10 text-pink-400",
  tiktok: "bg-purple-500/10 text-purple-400",
};

function formatMonthLabel(month: string): string {
  const [year, mo] = month.split("-").map(Number);
  const date = new Date(year, mo - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthOffset(month: string, offset: number): string {
  const [year, mo] = month.split("-").map(Number);
  const date = new Date(year, mo - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDefaultMonth(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

export default function WrapPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(getDefaultMonth);
  const [data, setData] = useState<WrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchWrap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wrap?month=${month}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchWrap();
  }, [fetchWrap]);

  const handleShare = async () => {
    if (!user) return;
    const url = `${window.location.origin}/wrap/${user.id}/${month}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGoForward = (() => {
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    const [y, m] = month.split("-").map(Number);
    const selected = new Date(y, m - 1, 1);
    return selected < current;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-white">Your Month in PostPilot</h2>
          <p className="text-white/40 text-sm mt-1">A look back at what you accomplished</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(getMonthOffset(month, -1))}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-white/70 min-w-[140px] text-center font-medium">
            {formatMonthLabel(month)}
          </span>
          <button
            onClick={() => canGoForward && setMonth(getMonthOffset(month, 1))}
            disabled={!canGoForward}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={month}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          {!data || data.totalPosts === 0 ? (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-16 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No wrap for this month</h3>
              <p className="text-white/40 text-sm">
                Publish some posts and come back to see your content wrap.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <motion.div
                className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 relative overflow-hidden"
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.05] via-transparent to-pink-500/[0.05] pointer-events-none" />
                <div className="relative">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                    {formatMonthLabel(data.month)} Recap
                  </p>

                  <div className="grid grid-cols-2 gap-6">
                    <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-white/40">Posts Published</span>
                      </div>
                      <p className="text-4xl font-light text-white">{data.totalPosts}</p>
                    </motion.div>

                    <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span className="text-xs text-white/40">Platforms Reached</span>
                      </div>
                      <p className="text-4xl font-light text-white">{data.totalPlatforms}</p>
                    </motion.div>

                    <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-xs text-white/40">Total Engagement</span>
                      </div>
                      <p className="text-4xl font-light text-white">
                        {data.totalEngagement.toLocaleString()}
                      </p>
                    </motion.div>

                    <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-white/40">Time Saved</span>
                      </div>
                      <p className="text-4xl font-light text-white">{data.timeSaved}</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8"
                custom={5}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/40 uppercase tracking-widest">Posts by Platform</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(data.platformBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([platform, count]) => {
                      const pct = Math.round((count / data.totalPosts) * 100);
                      return (
                        <div key={platform}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white/70 capitalize">
                              {platform === "twitter" ? "X" : platform}
                            </span>
                            <span className="text-xs text-white/40">
                              {count} post{count !== 1 ? "s" : ""} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>

              {data.topPost && (
                <motion.div
                  className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8"
                  custom={6}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/40 uppercase tracking-widest">Top Performing Post</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap mb-3">
                    {data.topPost.content}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {data.topPost.platforms.map((p) => (
                      <span
                        key={p}
                        className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${PLATFORM_COLORS[p] || "bg-white/5 text-white/40"}`}
                      >
                        {p === "twitter" ? "X" : p}
                      </span>
                    ))}
                    <span className="text-xs text-white/40">
                      {data.topPost.engagement.toLocaleString()} engagement
                    </span>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="flex justify-center pt-4"
                custom={7}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Share Your Wrap
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
