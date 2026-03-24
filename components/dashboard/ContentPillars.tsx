"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
// No lucide icons needed - parent handles section header

interface Pillar {
  title: string;
  description: string;
  color: string;
  topics: string[];
}

interface ContentPillarsProps {
  pillars: Pillar[];
}

const colorMap: Record<string, { gradient: string; border: string; tag: string; dot: string }> = {
  purple: {
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "hover:border-purple-500/30",
    tag: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    dot: "bg-purple-400",
  },
  blue: {
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "hover:border-blue-500/30",
    tag: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    dot: "bg-blue-400",
  },
  amber: {
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "hover:border-amber-500/30",
    tag: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    dot: "bg-amber-400",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "hover:border-emerald-500/30",
    tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
};

function getColorStyle(color: string) {
  return colorMap[color] ?? colorMap.purple;
}

export default function ContentPillars({ pillars }: ContentPillarsProps) {
  return (
    <div className="space-y-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {pillars.map((pillar) => {
          const style = getColorStyle(pillar.color);
          return (
            <motion.div
              key={pillar.title}
              variants={fadeInUp}
              className={`group bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 ${style.border} transition-all duration-500 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
              />

              <div className="relative z-10 space-y-3">
                {/* Pillar header */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                  <h4 className="text-sm font-semibold text-white">{pillar.title}</h4>
                </div>

                {/* Description */}
                <p className="text-xs text-white/40 leading-relaxed">{pillar.description}</p>

                {/* Topic tags */}
                <div className="flex flex-wrap gap-1.5">
                  {pillar.topics.map((topic) => (
                    <span
                      key={topic}
                      className={`px-2 py-0.5 rounded-md text-[11px] border ${style.tag} transition-colors duration-300`}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
