"use client";

import Link from "next/link";
import { ArrowRight, Command, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

// Psychology: Loss Aversion + Specificity + Social Proof + Authority Bias
// "The average creator wastes 14 hrs/week on content. Puls users don't."

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-16">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mt-10"
      >
        {/* Badge */}
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00BFFF]/20 bg-[#00BFFF]/[0.06] backdrop-blur-md mb-8"
        >
          <Zap className="w-4 h-4 text-[#00BFFF]" />
          <span className="text-sm text-[#F8F9FA] font-medium tracking-wide">
            800+ businesses · 14 hrs/week saved on average
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          className="text-4xl md:text-6xl lg:text-[5rem] font-light tracking-tight mb-6 leading-[1.08] text-[#F8F9FA]"
        >
          AI-powered{" "}
          <GooeyText
            texts={["brand manager", "content engine", "social strategy", "growth tool"]}
            className="inline-block h-[1em] translate-y-[0.15em] min-w-[4.5em]"
            textClassName="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#6DD5FF] font-light"
          />
          <br />for serious creators.
        </motion.h1>

        {/* Tagline — universal, brand-voice aligned */}
        <motion.p
          variants={fadeInUp}
          className="mt-4 max-w-xl mx-auto text-lg text-[#F8F9FA]/55 mb-10 font-normal leading-relaxed"
        >
          AI-generated posts, videos, and strategy — tailored to your brand.
          <br />
          <span className="text-[#F8F9FA]/40 text-base">Reliable, simple, and built for performance.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/signup" className="w-full sm:w-auto relative z-20">
            <InteractiveHoverButton
              text="Start free — no card needed"
              className="w-full sm:w-72 py-4 rounded-full text-[#0F1115] hover:text-[#F8F9FA] bg-[#00BFFF] border-transparent font-medium"
            />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-[#F8F9FA]/70 bg-white/[0.03] border border-white/[0.08] hover:border-[#00BFFF]/30 transition-colors duration-500 hover:bg-[#00BFFF]/[0.05] rounded-full backdrop-blur-md w-full sm:w-auto"
          >
            See how it works
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Universal value props */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { label: "From idea to calendar", desc: "AI builds your 30-day plan in one click" },
            { label: "Your brand voice", desc: "Learns how you talk. Writes like you." },
            { label: "Zero noise", desc: "Schedule, publish, and move on." },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center p-4 rounded-2xl border border-[#00BFFF]/[0.08] bg-[#00BFFF]/[0.02] backdrop-blur-sm">
              <span className="text-sm font-semibold text-[#F8F9FA]">{item.label}</span>
              <span className="text-xs text-[#F8F9FA]/40 mt-1 text-center">{item.desc}</span>
            </div>
          ))}
        </motion.div>

        {/* Psychology: Social Proof + Specificity — anchors trust via mimetic desire */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex flex-col items-center justify-center gap-3"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <img
                key={i}
                className="w-10 h-10 rounded-full border-2 border-black/50"
                src={`https://i.pravatar.cc/100?img=${i + 10}`}
                alt={`Business ${i}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[#F8F9FA]/80">
            <div className="flex gap-1 text-[#C08A46]">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {/* Psychology: Specificity — odd numbers feel more authentic than round ones */}
            <span className="text-sm font-medium text-[#F8F9FA]/70">Trusted by 800+ creators and businesses</span>
          </div>
        </motion.div>

        {/* Psychology: Anchoring + Authority — stat bar shows scale before they scroll */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: "14 hrs", label: "saved per week" },
            { value: "3.4\u00d7", label: "avg. engagement lift" },
            { value: "$36K", label: "saved vs. agency/year" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-[#00BFFF]">{stat.value}</span>
              <span className="text-xs text-[#F8F9FA]/40 mt-0.5 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
