"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, MessageSquare, Zap, Target } from "lucide-react";

interface ContentScorePanelProps {
  score: number;
  suggestions: string[];
  onApplySuggestion?: (suggestion: string) => void;
}

const scoreColor = (score: number) => {
  if (score >= 85) return { color: "#22c55e", label: "Excellent", glow: "rgba(34,197,94,0.3)" };
  if (score >= 70) return { color: "#3b82f6", label: "Strong", glow: "rgba(59,130,246,0.3)" };
  if (score >= 50) return { color: "#f59e0b", label: "Good", glow: "rgba(245,158,11,0.3)" };
  return { color: "#ef4444", label: "Needs Work", glow: "rgba(239,68,68,0.3)" };
};

const suggestionIcons: Record<string, any> = {
  hook: Sparkles,
  cta: Target,
  engagement: MessageSquare,
  trending: TrendingUp,
  default: Zap,
};

function getSuggestionIcon(suggestion: string) {
  const lower = suggestion.toLowerCase();
  if (lower.includes("hook") || lower.includes("opening")) return suggestionIcons.hook;
  if (lower.includes("cta") || lower.includes("call to action")) return suggestionIcons.cta;
  if (lower.includes("engage") || lower.includes("question")) return suggestionIcons.engagement;
  if (lower.includes("trend") || lower.includes("viral")) return suggestionIcons.trending;
  return suggestionIcons.default;
}

export default function ContentScorePanel({ score, suggestions, onApplySuggestion }: ContentScorePanelProps) {
  const { color, label, glow } = scoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - score / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-white/50" />
        <h3 className="text-sm font-medium text-white/70">Content Score</h3>
      </div>

      {/* Score Circle */}
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
              style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-light text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">/100</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${glow}` }}
            />
            <span className="text-sm font-medium text-white">{label}</span>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            {score >= 85
              ? "This content is ready to go viral. Ship it."
              : score >= 70
              ? "Strong content. A few tweaks could push it higher."
              : score >= 50
              ? "Decent foundation. Apply the suggestions below to level up."
              : "This needs some work. Check the suggestions below."}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wider">Improve your score</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => {
              const Icon = getSuggestionIcon(suggestion);
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  onClick={() => onApplySuggestion?.(suggestion)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
                >
                  <Icon className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors" />
                  {suggestion}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
