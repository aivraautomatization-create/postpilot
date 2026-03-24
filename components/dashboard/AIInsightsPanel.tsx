"use client";

import { motion } from "framer-motion";
import { Lightbulb, Brain } from "lucide-react";

const defaultInsights = [
  "Videos get 3.2x more engagement than images",
  "Posts with question hooks perform 40% better",
  "Tuesday and Thursday are your best posting days",
  "Carousel posts drive 2x more saves than single images",
  "Posting between 6-8 PM gets the highest reach",
];

interface AIInsightsPanelProps {
  insights?: string[];
}

export default function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const displayInsights = insights && insights.length > 0 ? insights : defaultInsights;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">AI Insights</h3>
            <p className="text-white/40 text-xs">Learned from your brand patterns</p>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-3">
          {displayInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10] transition-all duration-300"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
