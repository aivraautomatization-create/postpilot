"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Settings,
  Sparkles,
  BarChart3,
  Zap,
  FileText,
  Loader2,
  TrendingUp,
  Eye,
  Search,
  ShoppingCart,
  Heart,
  ChevronRight,
  Crown,
  FlaskConical,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandMemoryEntry {
  id: string;
  pattern_type: string;
  pattern_value: string;
  confidence_score: number;
}

interface StrategyReport {
  best_hooks: string[];
  best_formats: string[];
  best_posting_times: string[];
  summary: string;
}

interface Post {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  journey_stage: string | null;
  scheduled_for: string | null;
}

interface PostVariant {
  id: string;
  post_id: string;
  variant_label: string;
  content: string;
  hook: string | null;
  cta: string | null;
  selected: boolean;
  performance_data: { score?: number } | null;
  posts: {
    content: string;
    platforms: string[];
    status: string;
    user_id: string;
  };
}

// ─── Journey Stage config ─────────────────────────────────────────────────────

const STAGES = [
  {
    key: "awareness",
    label: "Awareness",
    icon: Eye,
    color: "text-blue-400",
    bg: "from-blue-500/20 to-sky-500/20",
    border: "border-blue-500/30",
    activeBorder: "border-blue-400",
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-300",
  },
  {
    key: "consideration",
    label: "Consideration",
    icon: Search,
    color: "text-purple-400",
    bg: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/30",
    activeBorder: "border-purple-400",
    badgeBg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
  },
  {
    key: "conversion",
    label: "Conversion",
    icon: ShoppingCart,
    color: "text-green-400",
    bg: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
    activeBorder: "border-green-400",
    badgeBg: "bg-green-500/10 border-green-500/20 text-green-300",
  },
  {
    key: "retention",
    label: "Retention",
    icon: Heart,
    color: "text-amber-400",
    bg: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    activeBorder: "border-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
  },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

// ─── Platform badge ───────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-[10px]">
      {platform}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrandBrainPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();

  const [brandMemory, setBrandMemory] = useState<BrandMemoryEntry[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [postsAnalyzed, setPostsAnalyzed] = useState(0);
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [topPatterns, setTopPatterns] = useState<BrandMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Content Funnel state
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [activeStageTab, setActiveStageTab] = useState<StageKey>("awareness");
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  // A/B Variants state
  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [markingWinner, setMarkingWinner] = useState<string | null>(null);

  // Fetch brand memory data
  useEffect(() => {
    async function fetchData() {
      if (!user || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch brand memory entries
        const { data: memoryData, count } = await supabase!
          .from("brand_memory")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("confidence_score", { ascending: false });

        if (memoryData) {
          setBrandMemory(memoryData as unknown as BrandMemoryEntry[]);
          setMemoryCount(count || memoryData.length);
          setTopPatterns(memoryData.slice(0, 5) as unknown as BrandMemoryEntry[]);
        }

        // Fetch posts analyzed count + all posts for funnel
        const { data: postsData, count: postCount } = await supabase!
          .from("posts")
          .select("id, content, platforms, status, journey_stage, scheduled_for", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setPostsAnalyzed(postCount || 0);
        if (postsData) {
          setAllPosts(postsData as unknown as Post[]);
        }
      } catch (err) {
        console.error("Error fetching brain data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, supabase]);

  // Fetch variants
  useEffect(() => {
    async function fetchVariants() {
      if (!user || !supabase) {
        setVariantsLoading(false);
        return;
      }

      try {
        const { data } = await supabase!
          .from("post_variants")
          .select("*, posts!inner(content, platforms, status, user_id)")
          .eq("posts.user_id", user.id)
          .limit(10);

        if (data) {
          setVariants(data as unknown as PostVariant[]);
        }
      } catch (err) {
        console.error("Error fetching variants:", err);
      } finally {
        setVariantsLoading(false);
      }
    }

    fetchVariants();
  }, [user, supabase]);

  // Fetch recommendations
  useEffect(() => {
    async function fetchRecommendations() {
      if (!user) return;
      try {
        const res = await fetch(`/api/brain/recommend?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.patterns) {
            setTopPatterns(data.patterns);
          }
        }
      } catch {
        // Fallback to supabase data already loaded
      }
    }
    fetchRecommendations();
  }, [user]);

  // Generate strategy report
  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/brain/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Update journey stage
  const handleStageChange = async (postId: string, newStage: string) => {
    setUpdatingStage(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/journey-stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyStage: newStage }),
      });

      if (res.ok) {
        setAllPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, journey_stage: newStage } : p))
        );
        toast.success("Stage updated");
      } else {
        toast.error("Failed to update stage");
      }
    } catch {
      toast.error("Failed to update stage");
    } finally {
      setUpdatingStage(null);
    }
  };

  // Mark variant as winner
  const handleMarkWinner = async (postId: string, variantId: string) => {
    setMarkingWinner(variantId);
    try {
      const res = await fetch(`/api/posts/${postId}/variants/${variantId}/select`, {
        method: "PATCH",
      });

      if (res.ok) {
        setVariants((prev) =>
          prev.map((v) => {
            if (v.post_id === postId) {
              return { ...v, selected: v.id === variantId };
            }
            return v;
          })
        );
        toast.success("Winner selected!");
      } else {
        toast.error("Failed to mark winner");
      }
    } catch {
      toast.error("Failed to mark winner");
    } finally {
      setMarkingWinner(null);
    }
  };

  const learningLevel = Math.min(100, Math.round((memoryCount / 50) * 100));

  const vibeDescription =
    profile?.tone_of_voice ||
    (profile?.niche
      ? `Conversational, friendly, and story-driven for the ${profile.niche} space`
      : "Connect your brand info to discover your AI-detected vibe");

  // Group posts by stage
  const postsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = allPosts.filter((p) => p.journey_stage === stage.key);
      return acc;
    },
    {} as Record<StageKey, Post[]>
  );

  // Group variants by post_id
  const variantsByPost = variants.reduce(
    (acc, v) => {
      if (!acc[v.post_id]) acc[v.post_id] = [];
      acc[v.post_id].push(v);
      return acc;
    },
    {} as Record<string, PostVariant[]>
  );

  const postIdsWithVariants = Object.keys(variantsByPost);

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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/20">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Your Brand AI-Brain</h1>
          </div>
          <p className="text-white/50 text-sm ml-14">
            Your AI learns what works for your brand and gets smarter over time
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Section 1: Brand Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-white font-semibold text-lg">Brand Profile</h2>
              </div>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors duration-300"
              >
                <Settings className="w-4 h-4" />
                Edit in Settings
              </Link>
            </div>

            {profile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Company Name", value: profile.company_name || profile.full_name },
                  { label: "Niche", value: profile.niche },
                  { label: "Industry", value: profile.industry },
                  { label: "Tone of Voice", value: profile.tone_of_voice },
                  { label: "Target Audience", value: profile.target_audience },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  >
                    <p className="text-white/30 text-xs mb-1">{item.label}</p>
                    <p className="text-white/70 text-sm">
                      {item.value || <span className="text-white/20 italic">Not set</span>}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-white/30 text-sm">
                  {loading ? "Loading profile..." : "No profile data found. Complete your onboarding to get started."}
                </p>
              </div>
            )}
          </motion.div>

          {/* Section 2: Your Vibe */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Your Vibe</h2>
            </div>

            <p className="text-white/60 text-sm mb-4 leading-relaxed">{vibeDescription}</p>

            <div className="flex flex-wrap gap-2">
              {((profile?.content_pillars as string[] | null | undefined) || ["Authentic", "Engaging", "Educational"]).map(
                (tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </motion.div>

          {/* Section 3: Learning Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Learning Progress</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <motion.p
                  className="text-2xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {memoryCount}
                </motion.p>
                <p className="text-white/40 text-xs mt-1">Patterns Learned</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <motion.p
                  className="text-2xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {postsAnalyzed}
                </motion.p>
                <p className="text-white/40 text-xs mt-1">Posts Analyzed</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-xs">Brain Learning Level</p>
                <p className="text-white/50 text-xs">{learningLevel}%</p>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${learningLevel}%` }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 4: Strategy Report */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-white font-semibold text-lg">Strategy Report</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all duration-300"
              >
                {reportLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Strategy Report
                  </>
                )}
              </motion.button>
            </div>

            {report ? (
              <div className="space-y-4">
                {report.summary && (
                  <p className="text-white/60 text-sm leading-relaxed">{report.summary}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {report.best_hooks && report.best_hooks.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">
                        Best Hooks
                      </p>
                      <ul className="space-y-1.5">
                        {report.best_hooks.map((hook, i) => (
                          <li key={i} className="text-white/60 text-sm">
                            {hook}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.best_formats && report.best_formats.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">
                        Best Formats
                      </p>
                      <ul className="space-y-1.5">
                        {report.best_formats.map((fmt, i) => (
                          <li key={i} className="text-white/60 text-sm">
                            {fmt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.best_posting_times && report.best_posting_times.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">
                        Best Times
                      </p>
                      <ul className="space-y-1.5">
                        {report.best_posting_times.map((time, i) => (
                          <li key={i} className="text-white/60 text-sm">
                            {time}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">
                  Generate a report to see your best hooks, formats, and posting times
                </p>
              </div>
            )}
          </motion.div>

          {/* Section 5: Top Performing Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Top Performing Patterns</h2>
            </div>

            {topPatterns.length > 0 ? (
              <div className="space-y-3">
                {topPatterns.map((pattern, index) => (
                  <motion.div
                    key={pattern.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        {pattern.pattern_type}
                      </span>
                      <p className="text-white/60 text-sm">{pattern.pattern_value}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                          style={{
                            width: `${Math.round(pattern.confidence_score * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-white/30 text-xs w-8 text-right">
                        {Math.round(pattern.confidence_score * 100)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">
                  {loading
                    ? "Loading patterns..."
                    : "No patterns detected yet. Create and publish posts to start learning."}
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Section 6: Content Funnel ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Content Funnel</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  How your content maps across the customer journey
                </p>
              </div>
            </div>

            {/* Funnel visualization */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const count = postsByStage[stage.key]?.length ?? 0;
                return (
                  <div key={stage.key} className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveStageTab(stage.key)}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border bg-gradient-to-br transition-all duration-300 ${stage.bg} ${
                        activeStageTab === stage.key
                          ? `${stage.activeBorder} shadow-lg`
                          : `${stage.border} opacity-70 hover:opacity-100`
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl ${
                          activeStageTab === stage.key ? "bg-white/10" : "bg-white/[0.04]"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${stage.color}`} />
                      </div>
                      <p className="text-white font-semibold text-sm">{stage.label}</p>
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${stage.badgeBg}`}
                      >
                        {count} {count === 1 ? "post" : "posts"}
                      </span>
                    </button>
                    {i < STAGES.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-white/20 hidden sm:block flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage tabs — posts list */}
            {(() => {
              const stagePosts = postsByStage[activeStageTab] ?? [];
              const stageConfig = STAGES.find((s) => s.key === activeStageTab)!;
              return (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <stageConfig.icon className={`w-4 h-4 ${stageConfig.color}`} />
                    <p className="text-white/60 text-sm font-medium">
                      {stageConfig.label} Posts
                    </p>
                    <span className="text-white/30 text-xs">({stagePosts.length})</span>
                  </div>

                  {stagePosts.length > 0 ? (
                    <div className="space-y-2">
                      {stagePosts.map((post) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10] transition-all duration-300"
                        >
                          {/* Content excerpt */}
                          <p className="flex-1 text-white/70 text-sm truncate min-w-0">
                            {post.content?.slice(0, 80) || "No content"}
                          </p>

                          {/* Platform badges */}
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                            {(post.platforms || []).slice(0, 2).map((p) => (
                              <PlatformBadge key={p} platform={p} />
                            ))}
                          </div>

                          {/* Scheduled date */}
                          {post.scheduled_for && (
                            <span className="text-white/30 text-xs flex-shrink-0 hidden sm:block">
                              {new Date(post.scheduled_for).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}

                          {/* Change stage dropdown */}
                          <select
                            value={post.journey_stage ?? ""}
                            onChange={(e) => handleStageChange(post.id, e.target.value)}
                            disabled={updatingStage === post.id}
                            className="flex-shrink-0 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white/60 outline-none focus:border-white/20 transition-colors cursor-pointer disabled:opacity-50 appearance-none"
                          >
                            <option value="" disabled className="bg-zinc-900">
                              Move to...
                            </option>
                            {STAGES.map((s) => (
                              <option key={s.key} value={s.key} className="bg-zinc-900">
                                {s.label}
                              </option>
                            ))}
                          </select>

                          {updatingStage === post.id && (
                            <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin flex-shrink-0" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <stageConfig.icon className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-white/30 text-sm">
                        No posts in the {stageConfig.label.toLowerCase()} stage yet.
                      </p>
                      <p className="text-white/20 text-xs mt-1">
                        Move posts here using the dropdown above, or assign a stage when creating posts.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>

          {/* ── Section 7: A/B Test Results ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <FlaskConical className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">A/B Test Results</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Compare variant performance and pick winners
                </p>
              </div>
            </div>

            {variantsLoading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                <p className="text-white/30 text-sm">Loading A/B tests...</p>
              </div>
            ) : postIdsWithVariants.length === 0 ? (
              <div className="text-center py-10">
                <FlaskConical className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm font-medium">No A/B tests yet.</p>
                <p className="text-white/25 text-xs mt-1 max-w-xs mx-auto">
                  Use the Variations feature when creating posts to start testing different hooks and CTAs.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {postIdsWithVariants.map((postId) => {
                  const postVariants = variantsByPost[postId];
                  const firstVariant = postVariants[0];
                  const postExcerpt =
                    firstVariant?.posts?.content?.slice(0, 60) ||
                    "Post content unavailable";

                  return (
                    <div
                      key={postId}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
                    >
                      {/* Card title */}
                      <p className="text-white/70 text-sm font-medium mb-4 truncate">
                        {postExcerpt}
                        {(firstVariant?.posts?.content?.length ?? 0) > 60 ? "…" : ""}
                      </p>

                      {/* Variants grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {postVariants.map((variant) => {
                          const score =
                            variant.performance_data?.score != null
                              ? variant.performance_data.score
                              : null;
                          const isWinner = variant.selected;
                          const isMarkingThis = markingWinner === variant.id;

                          return (
                            <motion.div
                              key={variant.id}
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 ${
                                isWinner
                                  ? "bg-green-500/[0.07] border-green-500/30"
                                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                              }`}
                            >
                              {/* Winner crown */}
                              {isWinner && (
                                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                                  <Crown className="w-3 h-3 text-green-400" />
                                  <span className="text-green-400 text-[10px] font-bold">Winner</span>
                                </div>
                              )}

                              {/* Label badge */}
                              <span className="self-start px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 text-xs font-medium">
                                {variant.variant_label || `Variation ${variant.id.slice(-2).toUpperCase()}`}
                              </span>

                              {/* Hook */}
                              {variant.hook ? (
                                <p className="text-white/70 text-xs leading-relaxed">
                                  <span className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Hook</span>
                                  {variant.hook}
                                </p>
                              ) : (
                                <p className="text-white/70 text-xs leading-relaxed line-clamp-3">
                                  {variant.content?.slice(0, 120) || "No content"}
                                </p>
                              )}

                              {/* Performance bar */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white/30 text-[10px] uppercase tracking-wider">Performance</span>
                                  {score != null ? (
                                    <span className="text-white/60 text-xs font-medium">{score}%</span>
                                  ) : null}
                                </div>
                                {score != null ? (
                                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full ${
                                        isWinner
                                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                          : "bg-gradient-to-r from-pink-500 to-rose-500"
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(score, 100)}%` }}
                                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                                    />
                                  </div>
                                ) : (
                                  <p className="text-white/30 text-xs italic">No data yet</p>
                                )}
                              </div>

                              {/* Mark as winner button */}
                              {!isWinner && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleMarkWinner(postId, variant.id)}
                                  disabled={isMarkingThis || markingWinner !== null}
                                  className="mt-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-xs font-medium transition-all duration-300 disabled:opacity-40"
                                >
                                  {isMarkingThis ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Marking...
                                    </>
                                  ) : (
                                    <>
                                      <Crown className="w-3 h-3" />
                                      Mark as Winner
                                    </>
                                  )}
                                </motion.button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
