"use client";

import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  totalPosts: number;
}

export default function StreakCard({ currentStreak, longestStreak, totalPosts }: StreakCardProps) {
  const flameSize = currentStreak >= 30 ? "w-10 h-10" : currentStreak >= 14 ? "w-8 h-8" : currentStreak >= 7 ? "w-7 h-7" : "w-6 h-6";
  const flameColor = currentStreak >= 30 ? "text-orange-400" : currentStreak >= 14 ? "text-amber-400" : currentStreak >= 7 ? "text-yellow-400" : "text-white/50";
  const glowColor = currentStreak >= 7 ? "shadow-[0_0_20px_rgba(251,191,36,0.3)]" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500"
    >
      {/* Glow background for active streaks */}
      {currentStreak >= 7 && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Flame icon with animation */}
          <motion.div
            className={`p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center ${glowColor}`}
            animate={currentStreak >= 7 ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame className={`${flameSize} ${flameColor} ${currentStreak >= 7 ? "fill-current" : ""} transition-all duration-500`} />
          </motion.div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light tracking-tight text-white">{currentStreak}</span>
              <span className="text-sm text-white/40">day streak</span>
            </div>
            {currentStreak >= 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/30 mt-0.5"
              >
                {currentStreak >= 30 ? "Legendary! You're unstoppable 🔥" :
                 currentStreak >= 14 ? "On fire! Keep the momentum going" :
                 currentStreak >= 7 ? "One week strong! Don't break it" :
                 "Nice start! Keep posting daily"}
              </motion.p>
            )}
          </div>
        </div>

        {/* Best streak */}
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Trophy className="w-3.5 h-3.5 text-white/30" />
            <span className="text-sm text-white/40">Best: {longestStreak}d</span>
          </div>
          <span className="text-xs text-white/20">{totalPosts} total posts</span>
        </div>
      </div>
    </motion.div>
  );
}
