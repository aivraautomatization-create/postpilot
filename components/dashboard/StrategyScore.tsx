"use client";

import { motion } from "framer-motion";

interface StrategyScoreProps {
  score: number;
  label?: string;
}

export default function StrategyScore({
  score,
  label = "Based on posting consistency, engagement trends, and AI learning",
}: StrategyScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Circular Progress Ring */}
        <div className="relative w-36 h-36 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Progress ring with gradient */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            />
          </svg>

          {/* Score number in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-4xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {clampedScore}
            </motion.span>
          </div>
        </div>

        {/* Label */}
        <h3 className="text-white font-semibold text-lg mb-1">Strategy Score</h3>
        <p className="text-white/40 text-xs leading-relaxed max-w-[220px]">{label}</p>
      </div>
    </motion.div>
  );
}
