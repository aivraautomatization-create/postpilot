"use client";

import { motion } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { scrollReveal } from "@/lib/motion";

type CellValue =
  | { type: "check"; label: string }
  | { type: "cross"; label: string }
  | { type: "warn"; label: string }
  | { type: "price"; value: string; highlight?: boolean }
  | { type: "text"; value: string; highlight?: boolean };

interface FeatureRow {
  feature: string;
  postpilot: CellValue;
  hootsuite: CellValue;
  buffer: CellValue;
  later: CellValue;
}

const rows: FeatureRow[] = [
  {
    feature: "AI content generation",
    postpilot: { type: "check", label: "Full" },
    hootsuite: { type: "cross", label: "None" },
    buffer: { type: "cross", label: "None" },
    later: { type: "cross", label: "None" },
  },
  {
    feature: "Viral strategy engine",
    postpilot: { type: "check", label: "Built-in" },
    hootsuite: { type: "cross", label: "None" },
    buffer: { type: "cross", label: "None" },
    later: { type: "cross", label: "None" },
  },
  {
    feature: "Auto-publish all platforms",
    postpilot: { type: "check", label: "6 platforms" },
    hootsuite: { type: "check", label: "5 platforms" },
    buffer: { type: "check", label: "3 platforms" },
    later: { type: "check", label: "2 platforms" },
  },
  {
    feature: "Image & video AI",
    postpilot: { type: "check", label: "Included" },
    hootsuite: { type: "cross", label: "Extra cost" },
    buffer: { type: "cross", label: "None" },
    later: { type: "cross", label: "None" },
  },
  {
    feature: "Analytics & insights",
    postpilot: { type: "check", label: "AI-powered" },
    hootsuite: { type: "check", label: "Basic" },
    buffer: { type: "check", label: "Basic" },
    later: { type: "warn", label: "Limited" },
  },
  {
    feature: "Price / month",
    postpilot: { type: "price", value: "$49", highlight: true },
    hootsuite: { type: "price", value: "$99" },
    buffer: { type: "price", value: "$60" },
    later: { type: "price", value: "$80" },
  },
  {
    feature: "Time to create a week of content",
    postpilot: { type: "text", value: "3 min", highlight: true },
    hootsuite: { type: "text", value: "4+ hrs" },
    buffer: { type: "text", value: "4+ hrs" },
    later: { type: "text", value: "4+ hrs" },
  },
];

function Cell({ value }: { value: CellValue }) {
  if (value.type === "check") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-sm">
        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
        {value.label}
      </span>
    );
  }
  if (value.type === "cross") {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-400/60 font-medium text-sm">
        <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
        {value.label}
      </span>
    );
  }
  if (value.type === "warn") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
        {value.label}
      </span>
    );
  }
  if (value.type === "price") {
    return (
      <span
        className={`font-semibold text-sm ${
          value.highlight ? "text-white" : "text-white/50"
        }`}
      >
        {value.value}
      </span>
    );
  }
  // type === "text"
  return (
    <span
      className={`font-semibold text-sm ${
        value.highlight ? "text-white" : "text-white/50"
      }`}
    >
      {value.value}
    </span>
  );
}

export default function ComparisonTable() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-5xl"
        {...scrollReveal}
      >
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Why founders choose PostPilot over the rest
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Every tool claims to save time. Only PostPilot eliminates the entire
            workflow.
          </p>
        </div>

        {/* Scrollable wrapper on mobile */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
          <table className="w-full min-w-[640px] border-collapse">
            {/* Table header */}
            <thead>
              <tr>
                {/* Empty first col */}
                <th className="py-4 px-5 text-left text-white/30 text-xs font-medium uppercase tracking-widest w-[220px] bg-white/[0.02]" />

                {/* PostPilot — highlighted */}
                <th className="py-4 px-5 text-center bg-white/[0.04] border-l border-r border-purple-500/20">
                  <span className="text-white font-semibold text-sm">
                    PostPilot
                  </span>
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-purple-400 bg-purple-500/10 rounded-full px-2 py-0.5">
                    Best
                  </span>
                </th>

                <th className="py-4 px-5 text-center text-white/40 text-sm font-medium bg-white/[0.02]">
                  Hootsuite
                </th>
                <th className="py-4 px-5 text-center text-white/40 text-sm font-medium bg-white/[0.02]">
                  Buffer
                </th>
                <th className="py-4 px-5 text-center text-white/40 text-sm font-medium bg-white/[0.02]">
                  Later
                </th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-t border-white/[0.05] ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                  }`}
                >
                  {/* Feature label */}
                  <td className="py-4 px-5 text-white/60 text-sm font-medium">
                    {row.feature}
                  </td>

                  {/* PostPilot — highlighted column */}
                  <td className="py-4 px-5 text-center bg-white/[0.04] border-l border-r border-purple-500/20">
                    <Cell value={row.postpilot} />
                  </td>

                  <td className="py-4 px-5 text-center">
                    <Cell value={row.hootsuite} />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <Cell value={row.buffer} />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <Cell value={row.later} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-800/40"
          >
            Start free trial — no credit card required
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
