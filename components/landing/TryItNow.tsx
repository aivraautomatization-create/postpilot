"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Copy, Check, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { scrollReveal } from "@/lib/motion";

const platforms = [
  { id: "Instagram", label: "Instagram", icon: Instagram },
  { id: "LinkedIn", label: "LinkedIn", icon: Linkedin },
  { id: "Twitter", label: "Twitter/X", icon: Twitter },
];

export default function TryItNow() {
  const [business, setBusiness] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!business.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/generate/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: business.trim(), platform }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data.content);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div {...scrollReveal} className="text-center mb-12">
          <h2 className="text-base font-medium leading-7 text-white">See for yourself</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Try PostPilot right now. Free.
          </p>
          <p className="mt-6 text-lg leading-8 text-white/60">
            Enter your business below and watch our AI write a post for you in seconds. No signup required.
          </p>
        </motion.div>

        <motion.div {...scrollReveal} className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Business input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Describe your business
              </label>
              <input
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="e.g. Online fitness coaching for busy professionals"
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors text-sm"
              />
            </div>

            {/* Platform selector */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Pick a platform
              </label>
              <div className="flex gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      platform === p.id
                        ? "bg-white/[0.08] border-white/30 text-white"
                        : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    <p.icon className="w-4 h-4" />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !business.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your post...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate a free post
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400/80 text-center">{error}</p>
            )}

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="relative rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs text-white/50 font-medium uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        Your {platform} post
                      </div>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{result}</p>
                  </div>

                  <div className="text-center space-y-3">
                    <p className="text-sm text-white/50">
                      Like what you see? Get 50 posts like this every month.
                    </p>
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold bg-white text-black rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95"
                    >
                      Start 14-Day Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
