"use client";

import Link from "next/link";
import { ArrowRight, Command, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

// Psychology: Loss Aversion + Specificity + Social Proof + Authority Bias
// "The average creator wastes 14 hrs/week on content. PostPilot users don't."

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-16">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mt-10"
      >
        {/* Psychology: Authority Bias + Specificity — concrete numbers build credibility */}
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-white font-medium tracking-wide">
            2M+ posts generated · 14 hrs/week saved per creator
          </span>
        </motion.div>

        {/* Psychology: Loss Aversion in headline — "stop losing" framing */}
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-7xl lg:text-[5.5rem] font-light tracking-tight mb-6 leading-[1.05] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60"
        >
          Stop losing weeks<br />to content.
        </motion.h1>

        {/* Psychology: Present Bias (immediate benefit) + Specificity + Loss Aversion */}
        <motion.p
          variants={fadeInUp}
          className="mt-6 max-w-2xl mx-auto text-xl text-white/60 mb-10 font-normal leading-relaxed"
        >
          In 3 minutes, PostPilot writes your entire week of platform-native content —
          tailored to your voice, your niche, and your audience. Every day you wait
          is reach you&apos;ll never recover.
        </motion.p>

        {/* CTAs — Psychology: Commitment & Consistency (low-commitment entry) + Regret Aversion (risk reversal) */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/signup" className="w-full sm:w-auto relative z-20">
            <InteractiveHoverButton
              text="Start Free — No Card Needed"
              className="w-full sm:w-72 py-4 rounded-full text-black hover:text-white dark:hover:text-black bg-white border-transparent"
            />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/40 transition-colors duration-500 hover:bg-white/[0.08] rounded-full backdrop-blur-md w-full sm:w-auto"
          >
            See How It Works
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Psychology: Social Proof + Specificity — anchors trust via mimetic desire */}
        <motion.div
          variants={fadeInUp}
          className="mt-12 flex flex-col items-center justify-center gap-3"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <img
                key={i}
                className="w-10 h-10 rounded-full border-2 border-black/50"
                src={`https://i.pravatar.cc/100?img=${i + 10}`}
                alt={`Creator ${i}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <div className="flex gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {/* Psychology: Specificity — odd numbers feel more authentic than round ones */}
            <span className="text-sm font-medium">Trusted by 2,847 creators &amp; teams</span>
          </div>
        </motion.div>

        {/* Psychology: Anchoring + Authority — stat bar shows scale before they scroll */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: "14 hrs", label: "saved per week" },
            { value: "3.4×", label: "avg. engagement lift" },
            { value: "$36K", label: "saved vs. agency/year" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-xs text-white/40 mt-0.5 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
