"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight } from "lucide-react";
import Link from "next/link";
import { scrollReveal } from "@/lib/motion";

export default function ROICalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(75);

  const monthlyCost = hoursPerWeek * hourlyRate * 4;
  const annualSavings = (monthlyCost - 99) * 12;
  const hoursSaved = hoursPerWeek * 4;

  return (
    <div className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div {...scrollReveal} className="text-center mb-12">
          <h2 className="text-base font-medium leading-7 text-white">Do the math</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            How much is social media costing you?
          </p>
          <p className="mt-6 text-lg leading-8 text-white/60">
            Your time has a price. See what you&apos;re really spending — and what PostPilot saves you.
          </p>
        </motion.div>

        <motion.div {...scrollReveal} className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Input Side */}
            <div className="p-8 space-y-8">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-white/70 mb-3">
                  <span>Hours per week on social media</span>
                  <span className="text-white font-semibold text-lg">{hoursPerWeek}h</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>1h</span>
                  <span>20h</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-white/70 mb-3">
                  <span>Your hourly rate</span>
                  <span className="text-white font-semibold text-lg">${hourlyRate}</span>
                </label>
                <input
                  type="range"
                  min={25}
                  max={300}
                  step={5}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>$25</span>
                  <span>$300</span>
                </div>
              </div>
            </div>

            {/* Results Side */}
            <div className="p-8 bg-white/[0.02] border-t lg:border-t-0 lg:border-l border-white/[0.08] space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">You currently spend</span>
                  <span className="text-lg font-semibold text-white/70 line-through">${monthlyCost.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">PostPilot costs</span>
                  <span className="text-lg font-semibold text-white">$99/mo</span>
                </div>
                <div className="h-px bg-white/[0.08]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70 font-medium">You save per year</span>
                  <span className="text-2xl font-light text-white">${annualSavings > 0 ? annualSavings.toLocaleString() : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70 font-medium">Hours saved per month</span>
                  <span className="text-2xl font-light text-white">{hoursSaved}h</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-white/30 mb-4">
                  Average agency: $3,500/mo for 15 posts. PostPilot: $99/mo for 50 posts.
                </p>
                <Link
                  href="/auth/signup"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Start saving now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
