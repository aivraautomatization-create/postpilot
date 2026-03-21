"use client";

import Link from "next/link";
import { ArrowRight, Command, Star } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Component, ReactNode } from "react";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { AwardBadge } from "@/components/ui/award-badge";

const InfiniteGallery = dynamic(() => import("@/components/ui/3d-gallery-photography"), {
  ssr: false,
  loading: () => null,
});

class GalleryErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

const socialImages = [
  { src: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop", alt: "Gaming setup" },
  { src: "https://images.unsplash.com/photo-1540324155970-1c8bf8993d04?w=600&auto=format&fit=crop", alt: "Business report" },
  { src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop", alt: "Fitness gym" },
  { src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop", alt: "Analytics dashboard" },
  { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop", alt: "Luxury real estate" },
  { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop", alt: "Marketing creative" },
  { src: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=600&auto=format&fit=crop", alt: "Sneaker product" },
  { src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop", alt: "Retail store" },
];

const subtitleText =
  "Stop juggling 6 apps and guessing the algorithm. PostPilot studies what's trending NOW, writes platform-specific hooks that crack each algorithm, and publishes everywhere in 3 minutes.";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden border-b border-white/[0.05]">
      {/* 3D Gallery Hero Background */}
      <div className="absolute inset-0 z-0 opacity-20 md:opacity-30 mix-blend-screen pointer-events-none">
        <GalleryErrorBoundary>
          <InfiniteGallery
            images={socialImages}
            speed={1.0}
            zSpacing={3}
            visibleCount={10}
            falloff={{ near: 0.8, far: 14 }}
            className="w-full h-full"
          />
        </GalleryErrorBoundary>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-transparent to-[#030303] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303] pointer-events-none" />

      {/* Main hero content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mt-10"
      >
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)] animate-pulse"
        >
          <Command className="w-4 h-4 text-white" />
          <span className="text-sm text-white font-medium tracking-wide">Postpilot AI 2.0 is here</span>
        </motion.div>

        {/* Gooey Text Hero Title */}
        <motion.div
          variants={fadeInUp}
          className="mb-0 sm:mb-6 h-[120px] sm:h-[180px] lg:h-[220px] flex items-center justify-center w-full relative z-20"
        >
          <GooeyText
            texts={[
              "Premium social media,\non autopilot.",
              "Viral content,\nautomated.",
              "6 platforms.\n3 minutes. Done.",
              "Your audience,\nalways growing.",
            ]}
            morphTime={1.5}
            cooldownTime={3}
            className="w-full"
            textClassName="text-5xl md:text-7xl lg:text-[5.5rem] font-light tracking-tight leading-[1.05] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60"
          />
        </motion.div>

        <motion.p
          variants={fadeInUp}
          className="mt-6 max-w-2xl mx-auto text-xl text-white/60 mb-10 font-normal leading-relaxed"
        >
          {subtitleText}
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-white text-black backdrop-blur-md rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            Start 7-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/40 hover:bg-white/[0.08] rounded-full backdrop-blur-md transition-all duration-500 w-full sm:w-auto"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Social Proof */}
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
                alt={`User ${i}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <div className="flex gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-sm font-medium">Trusted by 2,500+ creators</span>
          </div>
        </motion.div>

        {/* Award Badge */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex justify-center"
        >
          <AwardBadge type="product-of-the-day" place={1} />
        </motion.div>
      </motion.div>
    </div>
  );
}
