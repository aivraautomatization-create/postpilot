"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, BarChart3, Calendar } from "lucide-react";

interface TimelineEntry {
  month: string;
  label: string;
  postsPublished: number;
  avgEngagement: number;
  avgReach: number;
  totalEngagement: number;
}

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/timeline")
      .then((res) => res.json())
      .then((data) => setTimeline(data.timeline || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const formatMonth = (period: string) => {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (timeline.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">Your Growth Story</h2>
          <p className="text-white/50 text-sm">
            Start publishing to see your strategy evolve over time.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/40 text-sm">No data yet. Your timeline will appear here once you start publishing.</p>
        </div>
      </div>
    );
  }

  const maxEngagement = Math.max(...timeline.map((t) => t.avgEngagement), 1);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-light text-white mb-1">Your Growth Story</h2>
        <p className="text-white/50 text-sm">
          Watch how your strategy has evolved. Every month, PostPilot learns more about what works for your audience.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

        <div className="space-y-8">
          {timeline.map((entry, idx) => (
            <motion.div
              key={entry.month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-16"
            >
              {/* Timeline dot */}
              <div className="absolute left-4 top-3 w-4 h-4 rounded-full border-2 border-white/30 bg-[#050505]">
                <div className={`absolute inset-1 rounded-full ${idx === timeline.length - 1 ? "bg-white" : "bg-white/30"}`} />
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-xs text-white/50 font-medium">{formatMonth(entry.month)}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white">{entry.label}</h3>
                  </div>
                  {idx > 0 && timeline[idx - 1].avgEngagement > 0 && (
                    <div className={`text-xs font-medium px-2 py-1 rounded-md ${
                      entry.avgEngagement > timeline[idx - 1].avgEngagement
                        ? "bg-green-500/10 text-green-400"
                        : "bg-white/[0.05] text-white/40"
                    }`}>
                      {entry.avgEngagement > timeline[idx - 1].avgEngagement ? "+" : ""}
                      {Math.round(((entry.avgEngagement - timeline[idx - 1].avgEngagement) / Math.max(timeline[idx - 1].avgEngagement, 1)) * 100)}% engagement
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Posts</p>
                    <p className="text-xl font-light text-white">{entry.postsPublished}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Avg. engagement</p>
                    <p className="text-xl font-light text-white">{entry.avgEngagement}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Avg. reach</p>
                    <p className="text-xl font-light text-white">{entry.avgReach.toLocaleString()}</p>
                  </div>
                </div>

                {/* Engagement bar */}
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry.avgEngagement / maxEngagement) * 100}%` }}
                    transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-white/30 to-white rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
