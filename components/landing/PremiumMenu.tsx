"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { X, Menu as MenuIcon, ArrowRight, TrendingUp, Zap, ShieldCheck } from "lucide-react";

export default function PremiumMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const menuVariants: Variants = {
    closed: {
      opacity: 0,
      clipPath: "circle(0% at 100% 0%)",
      transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] as const }
    },
    open: {
      opacity: 1,
      clipPath: "circle(150% at 100% 0%)",
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] as const }
    }
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, y: 20 },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const }
    })
  };

  const links = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  const advantages = [
    {
      icon: ShieldCheck,
      title: "Why Us?",
      description: "We don't compromise on quality. Puls is engineered to deliver enterprise-grade performance, ensuring your brand is always represented by the highest standard of content."
    },
    {
      icon: TrendingUp,
      title: "Massive ROI",
      description: "Save an average of 15 hours per week per marketer. Brands using our AI generation see a 40% increase in social ROI within the first 60 days. (McKinsey & Co. benchmark, 2024)"
    },
    {
      icon: Zap,
      title: "The Viral Algorithm",
      description: "Our proprietary scheduling algorithm analyzes millions of data points to post exactly when your specific audience is hyper-active, increasing organic reach by up to 65%."
    }
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl flex flex-col md:flex-row h-screen w-screen overflow-hidden text-white"
          >
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none translate-y-1/3 -translate-x-1/3" />

            {/* Header (Mobile optimized) */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
              <span className="text-xl font-medium tracking-tight">Puls</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Navigation (Left Side) */}
            <div className="w-full md:w-5/12 h-full flex items-center justify-center px-8 pt-24 pb-12 overflow-y-auto z-10">
              <nav className="flex flex-col gap-6 w-full max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white mb-4 ml-1">Menu</p>
                {links.map((link, i) => (
                  <motion.div
                    custom={i}
                    variants={itemVariants}
                    key={link.name}
                  >
                    <Link 
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center gap-4 text-4xl md:text-6xl font-light text-white/50 hover:text-white transition-colors duration-500"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="w-8 h-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-white" />
                    </Link>
                  </motion.div>
                ))}
                
                <motion.div custom={links.length} variants={itemVariants} className="mt-12 space-y-4 ml-1">
                  <div className="text-sm text-white/40">
                    <p>hello@puls.work</p>
                    <p>Privacy Policy & Terms</p>
                  </div>
                  <div className="flex gap-4 pt-4 text-sm font-medium">
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="hover:text-white transition-colors">Instagram</a>
                    <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                  </div>
                </motion.div>
              </nav>
            </div>

            {/* Advantage Copy (Right Side) */}
            <div className="w-full md:w-7/12 h-full flex items-center px-8 md:px-16 pt-12 pb-24 md:py-12 bg-white/[0.02] border-l border-white/[0.05] overflow-y-auto z-10">
              <div className="max-w-xl space-y-16">
                {advantages.map((adv, i) => (
                  <motion.div 
                    custom={i + 3} 
                    variants={itemVariants}
                    key={adv.title}
                    className="relative group cursor-default"
                  >
                    <div className="absolute -inset-x-6 -inset-y-4 z-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl border border-white/[0.05]" />
                    <div className="relative z-10 flex gap-6">
                      <div className="shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-xl bg-blue-50/10 border border-white/20 flex items-center justify-center text-white shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]">
                          <adv.icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-white mb-3 tracking-tight">{adv.title}</h3>
                        <p className="text-base text-white/60 leading-relaxed font-light">
                          {adv.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <motion.div 
                  custom={7} 
                  variants={itemVariants}
                  className="pt-8 border-t border-white/10"
                >
                  <Link 
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold text-black bg-white rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 hover:scale-105"
                  >
                    Experience The Difference
                  </Link>
                </motion.div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
