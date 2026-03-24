"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  Clock,
  FileText,
  Lightbulb,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
} from "lucide-react";

interface Platform {
  name: string;
  icon: string;
  tips: string[];
  bestTimes: string;
  contentType: string;
}

interface PlatformPlaybookProps {
  platforms: Platform[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
};

function getPlatformIcon(icon: string) {
  return iconMap[icon.toLowerCase()] ?? FileText;
}

export default function PlatformPlaybook({ platforms }: PlatformPlaybookProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePlatform = platforms[activeIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 space-y-5"
    >
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {platforms.map((platform, i) => {
          const Icon = getPlatformIcon(platform.icon);
          const isActive = i === activeIndex;
          return (
            <button
              key={platform.name}
              onClick={() => setActiveIndex(i)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex-1 justify-center ${
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="playbook-tab"
                  className="absolute inset-0 bg-white/[0.08] border border-white/[0.12] rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{platform.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active platform content */}
      <AnimatePresence mode="wait">
        {activePlatform && (
          <motion.div
            key={activePlatform.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4"
          >
            {/* Meta row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Best Times</p>
                  <p className="text-xs text-white/70 mt-0.5">{activePlatform.bestTimes}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <FileText className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Content Type</p>
                  <p className="text-xs text-white/70 mt-0.5">{activePlatform.contentType}</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-2">
              <p className="text-xs text-white/30 uppercase tracking-wider">Tips & Tactics</p>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-1.5"
              >
                {activePlatform.tips.map((tip, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="group flex items-start gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-white/30 group-hover:text-amber-400/70 transition-colors duration-300 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors duration-300 leading-relaxed">
                      {tip}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
