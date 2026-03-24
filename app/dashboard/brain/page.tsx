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
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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

  // Fetch brand memory data
  useEffect(() => {
    async function fetchData() {
      if (!user || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch brand memory entries
        const { data: memoryData, count } = await (supabase as any)
          .from("brand_memory")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("confidence_score", { ascending: false });

        if (memoryData) {
          setBrandMemory(memoryData);
          setMemoryCount(count || memoryData.length);
          setTopPatterns(memoryData.slice(0, 5));
        }

        // Fetch posts analyzed count
        const { count: postCount } = await (supabase as any)
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setPostsAnalyzed(postCount || 0);
      } catch (err) {
        console.error("Error fetching brain data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, supabase]);

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

  const learningLevel = Math.min(100, Math.round((memoryCount / 50) * 100));

  const vibeDescription =
    profile?.tone_of_voice ||
    (profile?.niche
      ? `Conversational, friendly, and story-driven for the ${profile.niche} space`
      : "Connect your brand info to discover your AI-detected vibe");

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
            <h1 className="text-3xl font-bold text-white">Your Brand AI-Brain</h1>
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
              {(profile?.content_pillars || ["Authentic", "Engaging", "Educational"]).map(
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
        </div>
      </div>
    </div>
  );
}
