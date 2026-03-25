"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import Link from "next/link";

interface StreakNudgeModalProps {
  currentStreak: number;
  lastPostDate: string | null;
}

/**
 * Psychology: Loss Aversion + Endowed Progress Effect (Nunes & Dreze, 2006)
 * Users who've built a streak feel ownership of it — losing it triggers
 * disproportionate negative emotion (2x stronger than equivalent gain).
 * This modal fires when a streak is at risk (20-48 hrs since last post).
 */
export default function StreakNudgeModal({ currentStreak, lastPostDate }: StreakNudgeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Derive hours left from props (no side effects — React 19 compiler safe)
  const hoursLeft = useMemo(() => {
    if (!lastPostDate) return 0;
    // eslint-disable-next-line react-hooks/purity
    const hoursSincePost = (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60);
    return Math.max(0, Math.round(24 - hoursSincePost));
  }, [lastPostDate]);

  useEffect(() => {
    // Only nudge if they have a meaningful streak (3+ days)
    if (!lastPostDate || currentStreak < 3) return;

    const now = Date.now();
    const hoursSincePost = (now - new Date(lastPostDate).getTime()) / (1000 * 60 * 60);

    // Trigger window: 20-48 hours since last post (approaching the danger zone)
    if (hoursSincePost > 20 && hoursSincePost < 48) {
      const dismissedKey = `streak-nudge-${new Date(now).toISOString().split("T")[0]}`;
      const alreadyDismissed = sessionStorage.getItem(dismissedKey);
      if (!alreadyDismissed) {
        // Slight delay so it doesn't feel aggressive on page load
        const timer = setTimeout(() => setIsOpen(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastPostDate, currentStreak]);

  const dismiss = () => {
    setIsOpen(false);
    const dismissedKey = `streak-nudge-${new Date().toISOString().split("T")[0]}`;
    sessionStorage.setItem(dismissedKey, "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_40px_rgba(251,146,60,0.15)]">
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated flame */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/20"
            >
              <Flame className="w-6 h-6 text-orange-400 fill-orange-400" />
            </motion.div>

            <h3 className="text-lg font-semibold text-white mb-1">
              Your {currentStreak}-day streak is at risk
            </h3>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">
              {hoursLeft > 0
                ? `You have ~${hoursLeft}h left to keep it alive.`
                : "Post now before it resets."
              }
              {" "}Creators who maintain 7+ day streaks see{" "}
              <span className="text-orange-400 font-medium">3.2x more engagement</span>.
            </p>

            <div className="flex gap-3">
              <Link
                href="/dashboard/create"
                onClick={dismiss}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-semibold rounded-xl px-4 py-2.5 text-center text-sm hover:brightness-110 transition-all active:scale-95"
              >
                Post now
              </Link>
              <button
                onClick={dismiss}
                className="px-4 py-2.5 text-white/40 hover:text-white/60 text-sm transition-colors rounded-xl hover:bg-white/5"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
