"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import Link from "next/link";
import { scrollReveal } from "@/lib/motion";

interface FeatureRow {
  feature: string;
  puls: string | boolean | null;
  hootsuite: string | boolean | null;
  buffer: string | boolean | null;
  later: string | boolean | null;
}

const rows: FeatureRow[] = [
  {
    feature: "AI content generation",
    puls: "Full suite",
    hootsuite: false,
    buffer: false,
    later: false,
  },
  {
    feature: "Learns your brand voice",
    puls: "Built-in",
    hootsuite: false,
    buffer: false,
    later: false,
  },
  {
    feature: "Viral strategy engine",
    puls: "Built-in",
    hootsuite: false,
    buffer: false,
    later: false,
  },
  {
    feature: "Auto-publish",
    puls: "6 platforms",
    hootsuite: "5 platforms",
    buffer: "3 platforms",
    later: "2 platforms",
  },
  {
    feature: "Image & video AI",
    puls: "Included",
    hootsuite: null,
    buffer: false,
    later: false,
  },
  {
    feature: "Niche playbooks",
    puls: "100+ templates",
    hootsuite: false,
    buffer: false,
    later: null,
  },
  {
    feature: "AI analytics & insights",
    puls: "AI-powered",
    hootsuite: null,
    buffer: null,
    later: null,
  },
  {
    feature: "Starting price / mo",
    puls: "$19",
    hootsuite: "$99",
    buffer: "$60",
    later: "$80",
  },
  {
    feature: "Week of content in",
    puls: "3 min",
    hootsuite: "4+ hrs",
    buffer: "4+ hrs",
    later: "4+ hrs",
  },
];

const cols = [
  { key: "puls", label: "Puls", highlight: true },
  { key: "hootsuite", label: "Hootsuite", highlight: false },
  { key: "buffer", label: "Buffer", highlight: false },
  { key: "later", label: "Later", highlight: false },
];

function Cell({ value, highlight }: { value: string | boolean | null; highlight?: boolean }) {
  if (value === false) {
    return <X className="w-4 h-4 text-white/20 mx-auto" strokeWidth={2} />;
  }
  if (value === null) {
    return <Minus className="w-4 h-4 text-white/20 mx-auto" strokeWidth={2} />;
  }
  if (value === true) {
    return <Check className="w-4 h-4 text-white mx-auto" strokeWidth={2.5} />;
  }
  return (
    <span
      className={`text-sm font-medium ${
        highlight ? "text-white" : "text-white/40"
      }`}
    >
      {value}
    </span>
  );
}

export default function ComparisonTable() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <motion.div className="mx-auto max-w-4xl" {...scrollReveal}>

        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">
            How we compare
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight mb-4">
            Built different.<br />
            <span className="text-white/40">Not just cheaper.</span>
          </h2>
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-[#0a0a0a]">

          {/* Header */}
          <div className="grid grid-cols-[1fr_repeat(4,_minmax(0,_1fr))] border-b border-white/[0.07]">
            <div className="px-6 py-5" />
            {cols.map((col) => (
              <div
                key={col.key}
                className={`px-4 py-5 text-center border-l border-white/[0.05] ${
                  col.highlight ? "bg-white/[0.04]" : ""
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    col.highlight ? "text-white" : "text-white/30"
                  }`}
                >
                  {col.label}
                </span>
                {col.highlight && (
                  <span className="block mt-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                    Best value
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_repeat(4,_minmax(0,_1fr))] border-b border-white/[0.04] last:border-b-0 ${
                i % 2 === 0 ? "" : "bg-white/[0.01]"
              }`}
            >
              <div className="px-6 py-4 flex items-center">
                <span className="text-sm text-white/60 font-medium">{row.feature}</span>
              </div>
              {cols.map((col) => (
                <div
                  key={col.key}
                  className={`px-4 py-4 flex items-center justify-center border-l border-white/[0.04] ${
                    col.highlight ? "bg-white/[0.03]" : ""
                  }`}
                >
                  <Cell
                    value={row[col.key as keyof FeatureRow] as string | boolean | null}
                    highlight={col.highlight}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-white/90 text-black font-semibold text-sm transition-all duration-200 hover:scale-105"
          >
            Start free &mdash; no credit card required
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
