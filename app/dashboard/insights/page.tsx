"use client";

import { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Loader2, Sparkles, Calendar, Globe, Mic, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

type InsightsData = {
  postsAnalyzed: number;
  confidenceScore: number;
  bestDay: string | null;
  bestPlatform: string | null;
  engagementTrend: { month: string; avgEngagement: number }[];
  voiceProfile: {
    toneOfVoice: string | null;
    niche: string | null;
  };
};

const PLATFORM_DISPLAY: Record<string, string> = {
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function CircularProgress({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,1)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-light text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}%
        </motion.span>
        <span className="text-xs text-white/40 mt-1">confidence</span>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights");
        if (!res.ok) throw new Error("Failed to load insights");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center max-w-md">
          <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Unable to load insights</h3>
          <p className="text-white/40 text-sm">{error || "Please try again later."}</p>
        </div>
      </div>
    );
  }

  const chartData = data.engagementTrend.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-6 h-6 text-white/70" />
          <h2 className="text-2xl font-light tracking-tight text-white">Your AI Is Learning</h2>
        </div>
        <p className="text-white/40 text-sm">
          The longer you use PostPilot, the smarter it gets about your brand.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8"
        >
          <h3 className="text-base font-medium text-white mb-6 text-center">AI Confidence Score</h3>
          <CircularProgress score={data.confidenceScore} />
          <p className="text-sm text-white/40 text-center mt-6">
            PostPilot has analyzed{" "}
            <span className="text-white/70 font-medium">{data.postsAnalyzed} post{data.postsAnalyzed !== 1 ? "s" : ""}</span>{" "}
            and learned your writing style
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-rows-2 gap-6"
        >
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 flex items-center gap-5">
            <div className="p-3 rounded-xl bg-white/[0.05]">
              <Calendar className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <p className="text-sm text-white/40 mb-1">Best Performing Day</p>
              {data.bestDay ? (
                <p className="text-lg font-light text-white">
                  Your audience engages most on <span className="font-medium">{data.bestDay}</span>
                </p>
              ) : (
                <p className="text-lg font-light text-white/30">Not enough data yet</p>
              )}
            </div>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 flex items-center gap-5">
            <div className="p-3 rounded-xl bg-white/[0.05]">
              <Globe className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <p className="text-sm text-white/40 mb-1">Best Platform</p>
              {data.bestPlatform ? (
                <p className="text-lg font-light text-white">
                  Your best platform is{" "}
                  <span className="font-medium">
                    {PLATFORM_DISPLAY[data.bestPlatform] || data.bestPlatform}
                  </span>
                </p>
              ) : (
                <p className="text-lg font-light text-white/30">Not enough data yet</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <Mic className="w-5 h-5 text-white/50" />
          <h3 className="text-base font-medium text-white">Voice Profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">Tone of Voice</p>
            <p className="text-sm text-white font-medium capitalize">
              {data.voiceProfile.toneOfVoice || "Not set"}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">Niche</p>
            <p className="text-sm text-white font-medium capitalize">
              {data.voiceProfile.niche || "Not set"}
            </p>
          </div>
        </div>
        <p className="text-xs text-white/30 mt-4">
          PostPilot uses this to write content that sounds like you, not like AI.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5 text-white/50" />
          <h3 className="text-base font-medium text-white">Engagement Trend</h3>
        </div>
        {chartData.some((d) => d.avgEngagement > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
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
                labelFormatter={(label) => label}
                formatter={(value: any) => [value, "Avg Engagement"]}
              />
              <Area
                type="monotone"
                dataKey="avgEngagement"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
                fill="url(#engagementFill)"
                dot={false}
                name="Avg Engagement"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[260px]">
            <p className="text-white/30 text-sm">
              No engagement data yet. Publish posts and sync metrics to see trends.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
