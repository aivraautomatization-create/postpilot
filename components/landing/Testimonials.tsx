"use client";

import { motion } from "framer-motion";
import { scrollReveal, fadeInUp, staggerContainer } from "@/lib/motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder, LaunchKit",
    avatar: "https://i.pravatar.cc/100?img=32",
    quote: "I was spending 6 hours a week copy-pasting content across platforms. PostPilot cut that to 3 minutes. Literally.",
    metric: "6hrs → 3min/week",
  },
  {
    name: "Marcus Rivera",
    role: "Solo Founder, ShipFast",
    avatar: "https://i.pravatar.cc/100?img=53",
    quote: "My LinkedIn went from 200 impressions to 12K per post. The algorithm-specific hooks are insane.",
    metric: "60x more reach",
  },
  {
    name: "Emma Johansson",
    role: "Fitness Coach",
    avatar: "https://i.pravatar.cc/100?img=45",
    quote: "Fired my $3K/month agency after the first week. PostPilot writes better content than they ever did.",
    metric: "Saved $36K/year",
  },
  {
    name: "David Park",
    role: "Founder, DevTools.io",
    avatar: "https://i.pravatar.cc/100?img=60",
    quote: "The trending topic engine is the real differentiator. Every post feels timely and relevant, not like recycled AI slop.",
    metric: "3x engagement",
  },
  {
    name: "Aisha Patel",
    role: "E-commerce, GlowBox",
    avatar: "https://i.pravatar.cc/100?img=44",
    quote: "I post on 6 platforms now. Before PostPilot, I barely managed Instagram. My TikTok is blowing up.",
    metric: "1 → 6 platforms",
  },
  {
    name: "James Wright",
    role: "Real Estate Agent",
    avatar: "https://i.pravatar.cc/100?img=68",
    quote: "Clients ask me how I post so consistently. I just smile. PostPilot is my unfair advantage.",
    metric: "Daily posting streak",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div {...scrollReveal} className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-medium leading-7 text-white/60">Real founders, real results</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            They stopped juggling. They started growing.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeInUp}
              className="group bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 hover:border-white/20 transition-all duration-500 relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4 relative z-10">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-white/70 leading-relaxed mb-5 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Metric badge */}
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5 relative z-10">
                <span className="text-[10px] font-semibold text-white/80">{t.metric}</span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 relative z-10">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-9 h-9 rounded-full border border-white/10"
                />
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
