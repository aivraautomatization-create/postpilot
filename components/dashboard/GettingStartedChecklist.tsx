"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface ChecklistStep {
  label: string;
  completed: boolean;
  href: string;
}

interface GettingStartedChecklistProps {
  steps: ChecklistStep[];
}

export default function GettingStartedChecklist({ steps }: GettingStartedChecklistProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = steps.length > 0 ? completedCount / steps.length : 0;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference * (1 - percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start gap-6 mb-6">
          {/* Progress ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <defs>
                <linearGradient id="checklistGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(260,80%,65%)" />
                  <stop offset="100%" stopColor="hsl(190,90%,55%)" />
                </linearGradient>
              </defs>
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#checklistGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.3))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-light text-white">{completedCount}/{steps.length}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-1">Getting Started</h3>
            <p className="text-sm text-white/40">
              {completedCount === 0
                ? "Complete these steps to unlock PostPilot's full power."
                : completedCount === steps.length
                ? "All done! You're ready to dominate social media."
                : `${steps.length - completedCount} step${steps.length - completedCount > 1 ? "s" : ""} left. You're almost there!`}
            </p>
          </div>
        </div>

        {/* Steps */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {steps.map((step, i) => (
            <motion.div key={step.label} variants={fadeInUp}>
              <Link
                href={step.completed ? "#" : step.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  step.completed
                    ? "bg-white/[0.02] border border-white/[0.04]"
                    : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-white/20 flex-shrink-0" />
                )}
                <span
                  className={`text-sm flex-1 ${
                    step.completed ? "text-white/30 line-through" : "text-white/70"
                  }`}
                >
                  {step.label}
                </span>
                {!step.completed && (
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300" />
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
