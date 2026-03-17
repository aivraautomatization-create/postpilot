"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Share2, BarChart3, ChevronRight, Activity, ArrowUpRight, Instagram, Linkedin, Twitter } from "lucide-react";

const tabs = [
  {
    id: 0,
    title: "Premium AI Generation",
    description: "Generate excellent, high-converting text, images, and videos in seconds using state-of-the-art AI models.",
    icon: Sparkles
  },
  {
    id: 1,
    title: "Multi-Platform Publishing",
    description: "One click publishes your content to all of your social media accounts. Maximize your ROI and save countless hours.",
    icon: Share2
  },
  {
    id: 2,
    title: "AI Analyst",
    description: "Get deep insights into your audience engagement and growth metrics with our specialized AI.",
    icon: BarChart3
  }
];

const niches = [
  {
    id: "saas",
    name: "SaaS",
    prompt: "Minimalist product launch post.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=100&w=600",
    copy: "Stop guessing. Start knowing. Our Q3 metrics dashboard is live, giving you real-time visibility into revenue, churn, and retention. Link in bio to see it in action.",
  },
  {
    id: "realestate",
    name: "Real Estate",
    prompt: "Carousel post for beachfront property.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=100&w=600",
    copy: "Wake up to the sound of waves. 🌊 Pre-market access to our newest Malibu beachfront estate opens today. DM for private viewing. #LuxuryRealEstate",
  },
  {
    id: "fitness",
    name: "Fitness",
    prompt: "High-energy post on consistency.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=100&w=600",
    copy: "The hardest part isn't the workout—it's showing up. Consistency builds the foundation that intensity sits upon. Let's get it today. 🎯 #BuildTheFoundation",
  }
];

const AIGenerationDemo = () => {
  const [activeNiche, setActiveNiche] = useState(0);
  const niche = niches[activeNiche];

  return (
    <motion.div 
      key="ai-gen"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-[#050505] rounded-2xl border border-white/[0.08] overflow-hidden relative shadow-2xl"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-50/10 to-transparent pointer-events-none" />
      
      <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02] backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-[13px] font-medium text-white uppercase tracking-wider hidden sm:inline-block">Post Generator</span>
        </div>
        <div className="flex gap-1 bg-white/[0.05] p-1 rounded-lg border border-white/[0.05]">
          {niches.map((n, idx) => (
            <button
              key={n.id}
              onClick={() => setActiveNiche(idx)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors font-medium uppercase tracking-wider ${
                activeNiche === idx ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
              }`}
            >
              {n.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-hidden relative flex flex-col justify-end z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={niche.id + "-chat"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 flex flex-col w-full h-full justify-end"
          >
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-white/[0.08] backdrop-blur-md px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[80%] text-sm text-white border border-white/[0.05]">
                {niche.prompt}
              </div>
            </div>
            
            {/* AI Response showing generation process or the final result */}
            <div className="flex justify-start">
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl rounded-tl-md w-[280px] sm:w-[320px] p-4 space-y-3 shadow-glass-card shadow-white/10">
                <div className="flex items-center gap-2 text-xs text-white mb-2 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Generated successfully
                </div>
                
                <div className="w-full h-36 bg-black rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative group">
                  <img src={niche.image} alt={niche.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
                
                <p className="text-xs text-white/90 leading-relaxed font-outfit">
                  {niche.copy}
                </p>
                
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-[10px] text-white transition-colors uppercase tracking-wider font-semibold">Edit</button>
                  <button className="flex-1 px-3 py-1.5 rounded-lg bg-white text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-[10px] uppercase tracking-wider font-semibold transition-all">Publish</button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const PublishingDemo = () => (
  <motion.div 
    key="publishing"
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col h-full bg-[#050505] rounded-2xl border border-white/[0.08] overflow-hidden p-6 gap-4 shadow-2xl relative"
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
    
    <div className="flex items-center justify-between mb-2 relative z-10">
      <h3 className="text-sm font-medium text-white flex items-center gap-2">
        <Share2 className="w-4 h-4 text-white"/> Scheduled Queue
      </h3>
      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Today</span>
    </div>

    {[
      { plat: "Instagram", time: "10:00 AM", status: "Published", icon: Instagram, active: false },
      { plat: "LinkedIn", time: "02:30 PM", status: "Ready", icon: Linkedin, active: true },
      { plat: "Twitter", time: "05:00 PM", status: "Draft", icon: Twitter, active: false },
    ].map((item, idx) => (
      <motion.div 
        key={idx}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 + (idx * 0.1) }}
        className={`p-4 rounded-xl border flex items-center justify-between relative z-10 ${
          item.active 
            ? 'bg-white/[0.04] border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
            : 'bg-white/[0.02] border-white/[0.05]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/5 flex items-center justify-center text-lg shadow-inner">
            <item.icon className="w-4 h-4 text-white/70" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{item.plat} Post</p>
            <p className="text-xs text-white/40 mt-0.5">{item.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1.5 rounded-md border ${item.active ? 'text-white border-white/20 bg-blue-50/10' : 'text-white/40 border-white/10'}`}>
            {item.status}
          </span>
        </div>
      </motion.div>
    ))}
    
    <div className="mt-auto pt-4 border-t border-white/[0.05] flex justify-between items-center text-sm relative z-10">
      <div className="flex -space-x-2">
        {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border border-black bg-white/10 backdrop-blur-md" />)}
      </div>
      <button className="text-white hover:text-white font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1 transition-colors">Connect Integrations <ChevronRight className="w-3 h-3"/></button>
    </div>
  </motion.div>
);

const AnalystDemo = () => (
  <motion.div 
    key="analyst"
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col h-full bg-[#050505] rounded-2xl border border-white/[0.08] overflow-hidden p-6 shadow-2xl relative"
  >
    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-50/10 to-transparent pointer-events-none" />

    <div className="flex items-center justify-between mb-6 relative z-10">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-white" />
        <h3 className="text-sm font-medium text-white">Performance Overview</h3>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.1] text-[10px] uppercase tracking-wider font-semibold text-white/80 rounded-md px-2 py-1.5">
        Last 7 Days
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-xl p-4">
        <p className="text-xs text-white/50 mb-1">Total Reach</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-light text-white font-outfit">2.4M</span>
          <span className="text-xs text-white flex items-center mb-1 font-medium"><ArrowUpRight className="w-3 h-3"/> 14%</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-xl p-4">
        <p className="text-xs text-white/50 mb-1">Engagement</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-light text-white font-outfit">8.2%</span>
          <span className="text-xs text-white flex items-center mb-1 font-medium"><ArrowUpRight className="w-3 h-3"/> +2.1%</span>
        </div>
      </motion.div>
    </div>

    <div className="flex-1 border border-white/[0.05] rounded-xl bg-white/[0.02] backdrop-blur-sm relative overflow-hidden flex items-end px-0 pt-8 z-10">
      <svg className="w-full h-full text-white" viewBox="0 0 100 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <motion.path 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
          d="M0 40 Q20 30, 40 35 T80 15 T100 5 L100 40 L0 40 Z" fill="url(#gradient)" />
        <motion.path 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          d="M0 40 Q20 30, 40 35 T80 15 T100 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Plot points */}
        <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6 }} cx="80" cy="15" r="2" fill="currentColor" />
        <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 }} cx="100" cy="5" r="2" fill="#fff" />
      </svg>
    </div>
  </motion.div>
);

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center mb-16">
          <h2 className="text-sm font-semibold tracking-wider uppercase leading-7 text-white">Dashboard</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Powerful analytics & creation
          </p>
        </div>
        
        <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/[0.08] shadow-glass-card backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-50/30 to-transparent" />
          
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Side: Interactive Tabs */}
              <div className="space-y-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left rounded-2xl p-6 transition-all duration-300 relative overflow-hidden ${
                      activeTab === tab.id 
                        ? 'bg-white/[0.05] border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/20'
                    } border`}
                  >
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-transparent pointer-events-none opacity-50"
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-white/60'}`} />
                        <h3 className={`text-lg font-medium transition-colors ${activeTab === tab.id ? 'text-white' : 'text-white/80'}`}>
                          {tab.title}
                        </h3>
                      </div>
                      <p className={`text-sm leading-relaxed transition-colors pl-8 ${activeTab === tab.id ? 'text-white/70' : 'text-white/50'}`}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Side: Demo Render */}
              <div className="relative aspect-square lg:aspect-auto lg:h-[500px] w-[340px] sm:w-[380px] md:w-full lg:max-w-md mx-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 0 && <AIGenerationDemo />}
                  {activeTab === 1 && <PublishingDemo />}
                  {activeTab === 2 && <AnalystDemo />}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
