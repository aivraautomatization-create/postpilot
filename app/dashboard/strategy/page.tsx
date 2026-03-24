"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Flame,
  Search,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Link2,
  Zap,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Layers,
  BarChart2,
  AlignLeft,
  Video,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trend {
  topic: string;
  why_trending: string;
  post_angle: string;
  urgency: "high" | "medium" | "low";
  platforms: string[];
}

interface CompetitorAnalysis {
  hook_patterns: string[];
  content_formats: string[];
  cta_styles: string[];
  visual_style: string;
  posting_frequency: string;
  engagement_tactics: string[];
  suggested_variations: {
    hook: string;
    format: string;
    cta: string;
    why: string;
  }[];
}

// ─── Algorithm Presets (static) ───────────────────────────────────────────────

const ALGORITHM_PRESETS = [
  {
    id: "reels-optimized",
    platform: "Instagram",
    icon: Instagram,
    iconColor: "text-pink-400",
    iconBg: "from-pink-500/20 to-rose-500/20 border-pink-500/20",
    title: "Reels-Optimized",
    description: "Hook in first 0.8s, vertical 9:16, trending audio",
  },
  {
    id: "tiktok-storytelling",
    platform: "TikTok",
    icon: Video,
    iconColor: "text-sky-400",
    iconBg: "from-sky-500/20 to-cyan-500/20 border-sky-500/20",
    title: "TikTok Storytelling",
    description: "3-act structure, cliffhanger at 3s, CTA at end",
  },
  {
    id: "linkedin-value-bomb",
    platform: "LinkedIn",
    icon: Linkedin,
    iconColor: "text-blue-400",
    iconBg: "from-blue-500/20 to-indigo-500/20 border-blue-500/20",
    title: "LinkedIn Value-Bomb",
    description: "Bold stat opener, numbered list, thought leadership close",
  },
  {
    id: "twitter-thread",
    platform: "Twitter",
    icon: Twitter,
    iconColor: "text-white/70",
    iconBg: "from-white/10 to-white/5 border-white/10",
    title: "Twitter Thread",
    description: "Strong first tweet, 8-12 tweets, big reveal at end",
  },
  {
    id: "instagram-carousel",
    platform: "Instagram",
    icon: Layers,
    iconColor: "text-purple-400",
    iconBg: "from-purple-500/20 to-violet-500/20 border-purple-500/20",
    title: "Instagram Carousel",
    description: "Slide 1 = hook, slides 2-9 = value, last slide = CTA",
  },
  {
    id: "youtube-shorts",
    platform: "YouTube",
    icon: Youtube,
    iconColor: "text-red-400",
    iconBg: "from-red-500/20 to-rose-500/20 border-red-500/20",
    title: "YouTube Shorts",
    description: "Hook in 2s, fast cuts, subscribe CTA at 45s",
  },
];

// ─── Helper: Urgency badge ─────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: "high" | "medium" | "low" }) {
  const map = {
    high: {
      label: "Urgent",
      icon: AlertTriangle,
      cls: "bg-red-500/10 border-red-500/20 text-red-400",
    },
    medium: {
      label: "This Week",
      icon: Clock,
      cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    low: {
      label: "Emerging",
      icon: TrendingUp,
      cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
  };
  const { label, icon: Icon, cls } = map[urgency] || map.low;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Helper: Platform chip ─────────────────────────────────────────────────────

function PlatformChip({ name }: { name: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Instagram,
    TikTok: Video,
    LinkedIn: Linkedin,
    Twitter,
    YouTube: Youtube,
  };
  const Icon = iconMap[name];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs">
      {Icon && <Icon className="w-3 h-3" />}
      {name}
    </span>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function TrendSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-white/[0.06] rounded-lg w-2/3" />
      <div className="h-3 bg-white/[0.04] rounded-lg w-full" />
      <div className="h-3 bg-white/[0.04] rounded-lg w-4/5" />
      <div className="h-10 bg-white/[0.03] rounded-xl" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
        <div className="h-5 w-20 bg-white/[0.04] rounded-full" />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ViralStrategyPage() {
  // Profile niche pre-fill
  const [profileNiche, setProfileNiche] = useState("");

  // Trend Sniper state
  const [trendNiche, setTrendNiche] = useState("");
  const [trendPlatform, setTrendPlatform] = useState("all");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // Competitor Analyzer state
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorNiche, setCompetitorNiche] = useState("");
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [competitorAnalysis, setCompetitorAnalysis] =
    useState<CompetitorAnalysis | null>(null);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);

  // Load profile niche
  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabase();
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("profiles")
        .select("niche")
        .eq("id", user.id)
        .single();
      if (data?.niche) {
        setProfileNiche(data.niche);
        setTrendNiche(data.niche);
        setCompetitorNiche(data.niche);
      }
    }
    loadProfile();
  }, []);

  // ── Trend Sniper ─────────────────────────────────────────────────────────────

  const handleFindTrends = async () => {
    setTrendsLoading(true);
    setTrendsError(null);
    setTrends([]);

    try {
      const params = new URLSearchParams({
        niche: trendNiche || "general",
        platform: trendPlatform,
      });
      const res = await fetch(`/api/viral/trends?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setTrendsError(data.error || "Failed to fetch trends.");
        return;
      }

      if (data.raw) {
        setTrendsError(
          "Trend data returned as raw text — AI formatting unavailable. Please configure ANTHROPIC_API_KEY."
        );
        return;
      }

      setTrends(data.trends || []);
    } catch {
      setTrendsError("Network error. Please try again.");
    } finally {
      setTrendsLoading(false);
    }
  };

  // ── Competitor Analyzer ───────────────────────────────────────────────────────

  const handleAnalyzeCompetitor = async () => {
    if (!competitorUrl) return;
    setAnalyzerLoading(true);
    setAnalyzerError(null);
    setCompetitorAnalysis(null);

    try {
      const res = await fetch("/api/viral/analyze-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: competitorUrl, niche: competitorNiche }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAnalyzerError(data.error || "Failed to analyze competitor.");
        return;
      }

      setCompetitorAnalysis(data);
    } catch {
      setAnalyzerError("Network error. Please try again.");
    } finally {
      setAnalyzerLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Viral Strategy</h1>
          </div>
          <p className="text-white/50 text-sm ml-14">
            Snipe trending topics, decode competitors, and apply platform
            algorithms to go viral
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* ── Section 1: Trend Sniper ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <TrendingUp className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">
                  Trend Sniper
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Real-time trending topics with ready-to-use content angles
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="text"
                placeholder="Your niche (e.g. fitness, SaaS, fashion...)"
                value={trendNiche}
                onChange={(e) => setTrendNiche(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
              />
              <select
                value={trendPlatform}
                onChange={(e) => setTrendPlatform(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">
                  All Platforms
                </option>
                <option value="Instagram" className="bg-zinc-900">
                  Instagram
                </option>
                <option value="TikTok" className="bg-zinc-900">
                  TikTok
                </option>
                <option value="LinkedIn" className="bg-zinc-900">
                  LinkedIn
                </option>
                <option value="Twitter" className="bg-zinc-900">
                  Twitter
                </option>
                <option value="YouTube" className="bg-zinc-900">
                  YouTube
                </option>
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFindTrends}
                disabled={trendsLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all duration-300 whitespace-nowrap"
              >
                {trendsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sniping...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find Trends
                  </>
                )}
              </motion.button>
            </div>

            {/* Error */}
            {trendsError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {trendsError}
              </div>
            )}

            {/* Loading skeletons */}
            {trendsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <TrendSkeleton />
                <TrendSkeleton />
                <TrendSkeleton />
              </div>
            )}

            {/* Trend cards */}
            {!trendsLoading && trends.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trends.map((trend, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 hover:border-white/20 transition-all duration-300 flex flex-col gap-3"
                  >
                    {/* Topic + urgency */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-semibold text-sm leading-snug">
                        {trend.topic}
                      </h3>
                      <UrgencyBadge urgency={trend.urgency} />
                    </div>

                    {/* Why trending */}
                    <p className="text-white/50 text-xs leading-relaxed">
                      {trend.why_trending}
                    </p>

                    {/* Post angle */}
                    <div className="p-3 rounded-xl bg-purple-500/[0.07] border border-purple-500/20">
                      <p className="text-xs text-purple-300/70 font-medium uppercase tracking-wider mb-1">
                        Post Angle
                      </p>
                      <p className="text-purple-200 text-xs leading-relaxed">
                        {trend.post_angle}
                      </p>
                    </div>

                    {/* Platform chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {trend.platforms?.map((p) => (
                        <PlatformChip key={p} name={p} />
                      ))}
                    </div>

                    {/* Create post CTA */}
                    <Link
                      href={`/dashboard/create?topic=${encodeURIComponent(trend.topic)}&hook=${encodeURIComponent(trend.post_angle)}`}
                      className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/70 hover:text-white text-xs font-medium transition-all duration-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Create Post
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!trendsLoading && trends.length === 0 && !trendsError && (
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">
                  Enter your niche and click "Find Trends" to snipe viral
                  opportunities
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Section 2: Competitor Analyzer ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">
                  Competitor Analyzer
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Reverse-engineer any brand or influencer&apos;s content
                  strategy
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-white/20 transition-colors">
                <Link2 className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Paste a competitor or influencer link..."
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Their niche..."
                value={competitorNiche}
                onChange={(e) => setCompetitorNiche(e.target.value)}
                className="sm:w-44 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyzeCompetitor}
                disabled={analyzerLoading || !competitorUrl}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all duration-300 whitespace-nowrap"
              >
                {analyzerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </motion.button>
            </div>

            {/* Loading state */}
            {analyzerLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-white/50 text-sm">
                  Reverse-engineering their strategy...
                </p>
              </div>
            )}

            {/* Error */}
            {analyzerError && !analyzerLoading && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {analyzerError}
              </div>
            )}

            {/* Results */}
            {competitorAnalysis && !analyzerLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                {/* Grid: quick stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2 font-medium">
                      Posting Frequency
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {competitorAnalysis.posting_frequency}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2 font-medium">
                      Visual Style
                    </p>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {competitorAnalysis.visual_style}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2 font-medium">
                      Content Formats
                    </p>
                    <ul className="space-y-1">
                      {competitorAnalysis.content_formats?.map((f, i) => (
                        <li key={i} className="text-white/60 text-xs">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Hook patterns, CTA styles, Engagement tactics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2 font-medium">
                      Hook Patterns
                    </p>
                    <ul className="space-y-1.5">
                      {competitorAnalysis.hook_patterns?.map((h, i) => (
                        <li
                          key={i}
                          className="text-white/60 text-xs flex items-start gap-1.5"
                        >
                          <span className="text-purple-400 mt-0.5">›</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2 font-medium">
                      CTA Styles
                    </p>
                    <ul className="space-y-1.5">
                      {competitorAnalysis.cta_styles?.map((c, i) => (
                        <li
                          key={i}
                          className="text-white/60 text-xs flex items-start gap-1.5"
                        >
                          <span className="text-cyan-400 mt-0.5">›</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2 font-medium">
                      Engagement Tactics
                    </p>
                    <ul className="space-y-1.5">
                      {competitorAnalysis.engagement_tactics?.map((e, i) => (
                        <li
                          key={i}
                          className="text-white/60 text-xs flex items-start gap-1.5"
                        >
                          <span className="text-emerald-400 mt-0.5">›</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Variations */}
                {competitorAnalysis.suggested_variations?.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-medium">
                      Suggested Variations for Your Brand
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {competitorAnalysis.suggested_variations.map((v, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-purple-500/[0.07] to-violet-500/[0.04] border border-purple-500/20 space-y-2"
                        >
                          <div>
                            <p className="text-purple-300/70 text-[10px] uppercase tracking-wider mb-1 font-medium">
                              Hook
                            </p>
                            <p className="text-white/80 text-xs font-medium leading-relaxed">
                              {v.hook}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-[10px]">
                              {v.format}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-[10px]">
                              {v.cta}
                            </span>
                          </div>
                          <p className="text-white/40 text-[10px] leading-relaxed italic">
                            {v.why}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Empty state */}
            {!competitorAnalysis && !analyzerLoading && !analyzerError && (
              <div className="text-center py-8">
                <BarChart2 className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">
                  Paste any competitor or influencer URL to decode their content
                  strategy
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Section 3: Algorithm Presets ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">
                  Algorithm Presets
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Battle-tested formulas tuned to each platform&apos;s algorithm
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALGORITHM_PRESETS.map((preset, i) => (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/20 transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl bg-gradient-to-br ${preset.iconBg} border`}
                    >
                      <preset.icon className={`w-5 h-5 ${preset.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">
                        {preset.title}
                      </h3>
                      <p className="text-white/30 text-xs">{preset.platform}</p>
                    </div>
                  </div>
                  <p className="relative z-10 text-white/50 text-xs leading-relaxed">
                    {preset.description}
                  </p>
                  <Link
                    href={`/dashboard/create?preset=${preset.id}`}
                    className="relative z-10 mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all duration-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Use Preset
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
