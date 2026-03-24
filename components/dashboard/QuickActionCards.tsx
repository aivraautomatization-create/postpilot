"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { PenTool, Link as LinkIcon, TrendingUp, ArrowRight } from "lucide-react";

const actions = [
  {
    title: "Generate your first post",
    description: "Let AI create platform-specific content for your business in seconds",
    href: "/dashboard/create",
    icon: PenTool,
    gradient: "from-purple-500/20 to-pink-500/20",
    borderHover: "hover:border-purple-500/30",
  },
  {
    title: "Connect your accounts",
    description: "Link your social platforms so PostPilot can publish for you",
    href: "/dashboard/accounts",
    icon: LinkIcon,
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderHover: "hover:border-blue-500/30",
  },
  {
    title: "Get your viral strategy",
    description: "AI analyzes your niche and builds a content plan that cracks the algorithm",
    href: "/dashboard/strategy",
    icon: TrendingUp,
    gradient: "from-amber-500/20 to-orange-500/20",
    borderHover: "hover:border-amber-500/30",
  },
];

export default function QuickActionCards() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {actions.map((action) => (
        <motion.div key={action.title} variants={fadeInUp}>
          <Link
            href={action.href}
            className={`group block bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 ${action.borderHover} transition-all duration-500 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

            <div className="relative z-10">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] inline-flex mb-4 group-hover:bg-white/[0.08] transition-colors">
                <action.icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors duration-300" />
              </div>

              <h3 className="text-sm font-semibold text-white mb-1.5">{action.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed mb-4">{action.description}</p>

              <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/70 transition-colors">
                <span>Get started</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
