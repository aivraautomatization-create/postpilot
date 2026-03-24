"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { LayoutDashboard, Calendar, BarChart2, Lightbulb, Twitter, Linkedin, Instagram, Sparkles, Send } from "lucide-react";

const navItems = [
  { icon: Sparkles, label: "Create" },
  { icon: Calendar, label: "Schedule" },
  { icon: BarChart2, label: "Analytics" },
  { icon: Lightbulb, label: "Strategy" },
];

const platforms = [
  { icon: Twitter, label: "Twitter", color: "text-sky-400", active: true },
  { icon: Linkedin, label: "LinkedIn", color: "text-blue-400", active: true },
  { icon: Instagram, label: "Instagram", color: "text-pink-400", active: false },
];

const examplePost = `🚀 After 6 months of building in public, here's what actually moved the needle:

→ Consistency > virality. Posted every day, even when nobody was watching.
→ Short-form video drove 80% of new followers.
→ Engaging with comments in the first hour doubled reach.

The algorithm rewards persistence. PostPilot made showing up effortless.

What's your biggest growth lever this quarter? 👇

#BuildInPublic #StartupGrowth #Founder`;

export default function DashboardPreview() {
  const titleComponent = (
    <div className="text-center mb-8 px-4">
      <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-white leading-tight">
        Your entire social media operation,
        <br className="hidden sm:block" /> in one place.
      </h2>
      <p className="mt-4 text-base sm:text-lg text-white/50 max-w-xl mx-auto">
        Watch how PostPilot works while you scroll
      </p>
    </div>
  );

  return (
    <div className="relative z-10 overflow-hidden">
      <ContainerScroll titleComponent={titleComponent}>
        {/* Dashboard mockup */}
        <div className="flex h-full w-full bg-[#0a0a0a] text-white overflow-hidden rounded-xl">

          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-44 flex-shrink-0 border-r border-white/[0.06] bg-[#0d0d0d] p-4 gap-1">
            <div className="flex items-center gap-2 mb-6 px-1">
              <div className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center">
                <LayoutDashboard className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-sm font-semibold text-white">PostPilot</span>
            </div>
            {navItems.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  label === "Create"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </aside>

          {/* Main content */}
          <main className="flex flex-1 overflow-hidden">

            {/* Left panel — Generate content */}
            <div className="flex flex-col flex-1 border-r border-white/[0.06] p-4 gap-4 min-w-0">
              {/* Top nav bar */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div>
                  <h1 className="text-sm font-semibold text-white">Generate Content</h1>
                  <p className="text-xs text-white/35 mt-0.5">AI-powered post creation</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-white/40">Live</span>
                </div>
              </div>

              {/* Prompt field */}
              <div className="flex-shrink-0">
                <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-widest">
                  What do you want to post about?
                </label>
                <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-xs text-white/60 leading-relaxed min-h-[70px]">
                  After 6 months of building in public, here&apos;s what actually moved the needle for our startup growth...
                  <span className="inline-block w-0.5 h-3 bg-white/60 ml-0.5 animate-pulse align-middle" />
                </div>
              </div>

              {/* Platform toggles */}
              <div className="flex-shrink-0">
                <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-widest">
                  Platforms
                </label>
                <div className="flex gap-2 flex-wrap">
                  {platforms.map(({ icon: Icon, label, color, active }) => (
                    <button
                      key={label}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? `border-white/20 bg-white/[0.07] ${color}`
                          : "border-white/[0.06] bg-transparent text-white/25"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone selector */}
              <div className="flex-shrink-0">
                <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-widest">
                  Tone
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {["Authentic", "Bold", "Educational", "Inspiring"].map((tone) => (
                    <span
                      key={tone}
                      className={`rounded-full px-2.5 py-1 text-xs border ${
                        tone === "Authentic"
                          ? "border-white/30 bg-white/[0.08] text-white"
                          : "border-white/[0.06] text-white/30"
                      }`}
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <div className="mt-auto flex-shrink-0">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-black hover:bg-white/90 transition-all">
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Posts
                </button>
              </div>
            </div>

            {/* Right panel — Generated post preview */}
            <div className="hidden lg:flex flex-col flex-1 p-4 gap-4 min-w-0">
              <div className="flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-semibold text-white">Generated Post</h2>
                <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5">
                  Ready to publish
                </span>
              </div>

              {/* Post card */}
              <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 overflow-auto">
                {/* Author row */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    F
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">Founder</p>
                    <p className="text-xs text-white/35 leading-tight">@founder · Just now</p>
                  </div>
                </div>

                {/* Post body */}
                <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">
                  {examplePost}
                </p>

                {/* Action row */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.05]">
                  <button className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors">
                    <Twitter className="w-3 h-3" />
                    <span>Twitter</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors">
                    <Linkedin className="w-3 h-3" />
                    <span>LinkedIn</span>
                  </button>
                  <div className="ml-auto">
                    <button className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.1] px-3 py-1.5 text-xs font-semibold text-white transition-all">
                      <Send className="w-3 h-3" />
                      Publish now
                    </button>
                  </div>
                </div>
              </div>

              {/* Analytics mini row */}
              <div className="flex-shrink-0 grid grid-cols-3 gap-2">
                {[
                  { label: "Est. reach", value: "12.4K" },
                  { label: "Eng. rate", value: "4.2%" },
                  { label: "Best time", value: "9:00 AM" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center"
                  >
                    <p className="text-sm font-semibold text-white">{value}</p>
                    <p className="text-xs text-white/35 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </ContainerScroll>
    </div>
  );
}
