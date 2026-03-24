"use client";

import { motion } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";

interface Recommendation {
  platform: string;
  topic: string;
  format: string;
}

interface TodaysPlanProps {
  recommendations?: Recommendation[];
}

export default function TodaysPlan({ recommendations }: TodaysPlanProps) {
  const hasData = recommendations && recommendations.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500"
    >
      {/* Subtle gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Today&apos;s Plan</h3>
            <p className="text-white/40 text-xs">AI-recommended content</p>
          </div>
        </div>

        {/* Recommendations or Placeholder */}
        {hasData ? (
          <div className="space-y-3 mb-5">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg shrink-0">
                  {rec.platform}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{rec.topic}</p>
                  <p className="text-white/40 text-xs">{rec.format}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center">
            <Sparkles className="w-6 h-6 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              Connect your brand info to get AI recommendations
            </p>
          </div>
        )}

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-purple-500/20"
        >
          <Sparkles className="w-4 h-4" />
          AI-Create 7-Day Batch
        </motion.button>
      </div>
    </motion.div>
  );
}
