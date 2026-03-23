"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, TrendingUp, Clock, Target, Lightbulb, Video, CheckCircle2, FileText, Link as LinkIcon, Calendar, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import ContentPillars from "@/components/dashboard/ContentPillars";
import PlatformPlaybook from "@/components/dashboard/PlatformPlaybook";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

interface StructuredStrategy {
  pillars: { title: string; description: string; color: string; topics: string[] }[];
  platforms: { name: string; icon: string; tips: string[]; bestTimes: string; contentType: string }[];
  weeklySchedule: { day: string; focus: string; platform: string }[];
  multiplierHacks: { title: string; description: string }[];
}

export default function StrategyPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [structured, setStructured] = useState<StructuredStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    generateStrategy();
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch {
        // Non-blocking
      }
    }
    fetchAnalytics();
  }, []);

  const generateStrategy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      let profile = null;
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profile = data;
        }
      }

      if (!profile || !profile.company_name) {
        setError("Please complete your company profile in settings to get personalized strategy insights.");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/generate/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate strategy.");
      }

      const strategyText = data.content || "Failed to generate insights.";
      setInsights(strategyText);

      // Set structured data if available
      if (data.structured) {
        setStructured(data.structured);
      }

      // Save strategy to Supabase for use in content creation
      if (strategyText && strategyText !== "Failed to generate insights." && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any)
            .from('profiles')
            .update({ latest_strategy: strategyText })
            .eq('id', user.id);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating strategy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">Viral Strategy</h2>
          <p className="text-white/50">AI-powered insights tailored to your specific niche and audience.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Strategy saved
            </div>
          )}
          <button
            onClick={generateStrategy}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Refresh Strategy
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Vanish Input Search Bar */}
      <div className="w-full max-w-2xl mx-auto py-6">
        <PlaceholdersAndVanishInput
          placeholders={["What kind of strategy do you need today?", "Analyze a new viral trend...", "Brainstorm a campaign..."]}
          onChange={() => {}}
          onSubmit={(e) => {
            e.preventDefault();
            generateStrategy();
          }}
        />
      </div>

      {/* Loading State */}
      {isLoading && !insights ? (
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-white text-black backdrop-blur-md blur-xl opacity-50 mix-blend-screen" />
            <Loader2 className="w-10 h-10 text-white animate-spin relative z-10" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Analyzing Algorithm Trends...</h3>
          <p className="text-white/50 text-center max-w-md">
            Our AI is analyzing current social media algorithms to build a custom viral strategy for your specific niche.
          </p>
        </div>
      ) : structured ? (
        /* Structured Visual Strategy */
        <div className="space-y-8">
          {/* Content Pillars */}
          {structured.pillars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-white/50" />
                This Week&apos;s Content Pillars
              </h3>
              <ContentPillars pillars={structured.pillars} />
            </motion.div>
          )}

          {/* Platform Playbook */}
          {structured.platforms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-white/50" />
                Platform Playbook
              </h3>
              <PlatformPlaybook platforms={structured.platforms} />
            </motion.div>
          )}

          {/* Weekly Posting Schedule */}
          {structured.weeklySchedule.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/50" />
                Weekly Posting Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {structured.weeklySchedule.map((day, i) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-xl p-4 hover:border-white/20 transition-all duration-300 group"
                  >
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">{day.day}</p>
                    <p className="text-sm text-white/60 mb-2 leading-relaxed">{day.focus}</p>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-[10px] text-white/50">{day.platform}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Multiplier Hacks */}
          {structured.multiplierHacks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-white/50" />
                Growth Multipliers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structured.multiplierHacks.map((hack, i) => (
                  <motion.div
                    key={hack.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 hover:border-white/20 transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-white">{hack.title}</h4>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">{hack.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Full Strategy (collapsible) */}
          {insights && (
            <details className="group">
              <summary className="flex items-center gap-2 text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors py-2">
                <FileText className="w-4 h-4" />
                View full strategy text
              </summary>
              <div className="mt-4 bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8">
                <div className="prose prose-invert max-w-none prose-headings:font-light prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-white/70 prose-li:text-white/70">
                  <ReactMarkdown>{insights}</ReactMarkdown>
                </div>
              </div>
            </details>
          )}
        </div>
      ) : insights ? (
        /* Fallback: markdown rendering */
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8">
          <div className="prose prose-invert max-w-none prose-headings:font-light prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-white/70 prose-li:text-white/70">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-50/10 to-sky-300/10 border border-white/[0.06] rounded-xl text-white">
              <FileText className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="font-medium text-white">Posts This Month</h3>
          </div>
          <p className="text-2xl font-light text-white mb-1">{analytics?.stats?.postsThisMonth ?? '—'}</p>
          <p className="text-sm text-white/40">total published this month</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 border border-white/[0.06] rounded-xl text-blue-300">
              <Target className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="font-medium text-white">Success Rate</h3>
          </div>
          <p className="text-2xl font-light text-white mb-1">{analytics?.stats?.successRate ?? '—'}%</p>
          <p className="text-sm text-white/40">publish success rate</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-rose-400/20 to-purple-500/20 border border-white/[0.06] rounded-xl text-rose-300">
              <LinkIcon className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="font-medium text-white">Active Platforms</h3>
          </div>
          <p className="text-2xl font-light text-white mb-1">{analytics?.stats?.activePlatforms ?? '—'}</p>
          <p className="text-sm text-white/40">connected accounts</p>
        </div>
      </div>
    </div>
  );
}
