"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Video, RefreshCw, Wand2 } from "lucide-react";

const presets = [
  {
    label: "AI-generate 7-day calendar",
    icon: Sparkles,
    param: "7day-calendar",
  },
  {
    label: "AI-create 5 Reels-style videos",
    icon: Video,
    param: "reels-videos",
  },
  {
    label: "AI-repurpose this blog/script",
    icon: RefreshCw,
    param: "repurpose",
  },
  {
    label: "AI-optimize existing posts",
    icon: Wand2,
    param: "optimize",
  },
];

export default function QuickAILauncher() {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Quick AI Launcher</h3>
            <p className="text-white/40 text-xs">Describe your idea or pick a preset</p>
          </div>
        </div>

        {/* Big Input Area */}
        <div
          className={`relative rounded-xl p-[1px] mb-5 transition-all duration-500 ${
            isFocused
              ? "bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500"
              : "bg-white/[0.08]"
          }`}
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe what you want to post (topic, occasion, goal)..."
            rows={3}
            className="w-full bg-black rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none"
          />
        </div>

        {/* Preset Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presets.map((preset, index) => {
            const Icon = preset.icon;
            return (
              <motion.div
                key={preset.param}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Link
                  href={`/dashboard/create?preset=${preset.param}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.05] transition-all duration-300 group/btn"
                >
                  <div className="p-2 rounded-lg bg-white/[0.04] group-hover/btn:bg-purple-500/10 transition-colors duration-300">
                    <Icon className="w-4 h-4 text-white/50 group-hover/btn:text-purple-400 transition-colors duration-300" />
                  </div>
                  <span className="text-white/60 text-sm group-hover/btn:text-white/90 transition-colors duration-300">
                    {preset.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
