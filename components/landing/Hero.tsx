"use client";

import Link from "next/link";
import { ArrowRight, Command, Star } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-16">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mt-10"
      >
        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)] animate-pulse">
          <Command className="w-4 h-4 text-white" />
          <span className="text-sm text-white font-medium tracking-wide">Postpilot AI 2.0 is here</span>
        </motion.div>
        
        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-[5.5rem] font-light tracking-tight mb-6 leading-[1.05] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
          Premium social media,<br />on autopilot.
        </motion.h1>
        
        <motion.p variants={fadeInUp} className="mt-6 max-w-2xl mx-auto text-xl text-white/60 mb-10 font-normal leading-relaxed">
          AI generates your entire week of excellent content in 3 minutes. Publish to all of your social media instantly. Save thousands on marketing agencies and paid ads while your audience grows with massive ROI.
        </motion.p>
        
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-white text-black backdrop-blur-md rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            Start 7-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="#features" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/40 transition-colors duration-500 hover:bg-white/[0.08] rounded-full backdrop-blur-md transition-all w-full sm:w-auto"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Social Proof Section */}
        <motion.div variants={fadeInUp} className="mt-16 flex flex-col items-center justify-center gap-3">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <img 
                key={i} 
                className="w-10 h-10 rounded-full border-2 border-black/50" 
                src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                alt={`User ${i}`} 
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <div className="flex gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <span className="text-sm font-medium">Trusted by 2,500+ creators</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
