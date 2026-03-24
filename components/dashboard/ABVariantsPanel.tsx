"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Variant {
  label: string;
  content: string;
  hook: string;
  cta: string;
}

interface ABVariantsPanelProps {
  content: string;
  platform: string;
  niche?: string;
  onSelectVariant: (content: string) => void;
}

const LABEL_COLORS: Record<string, string> = {
  A: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  B: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  C: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function ABVariantsPanel({
  content,
  platform,
  niche,
  onSelectVariant,
}: ABVariantsPanelProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const generateVariants = async () => {
    if (!content.trim()) {
      toast.error("Please generate or write some content first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setVariants([]);
    setSelectedLabel(null);

    try {
      const res = await fetch("/api/generate/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform,
          niche: niche || "general",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate variants");
      }

      setVariants(data.variants);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (variant: Variant) => {
    setSelectedLabel(variant.label);
    onSelectVariant(variant.content);
    toast.success(`Variation ${variant.label} applied to your post.`);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">A/B Variants</h3>
            <p className="text-white/40 text-xs">Test 3 different hook & CTA styles</p>
          </div>
        </div>

        <button
          onClick={generateVariants}
          disabled={isLoading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white text-xs font-medium hover:bg-white/[0.10] hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : variants.length > 0 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate 3 Variations
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={generateVariants}
              className="flex items-center gap-1 text-red-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3 animate-pulse"
            >
              <div className="h-5 w-16 bg-white/10 rounded-full" />
              <div className="h-4 w-full bg-white/[0.06] rounded" />
              <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
              <div className="h-16 w-full bg-white/[0.04] rounded-lg" />
              <div className="h-8 w-full bg-white/[0.06] rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Variant cards */}
      <AnimatePresence>
        {!isLoading && variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {variants.map((variant, idx) => {
              const isSelected = selectedLabel === variant.label;
              const labelColor =
                LABEL_COLORS[variant.label] ||
                "bg-white/10 text-white/70 border-white/20";

              return (
                <motion.div
                  key={variant.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`flex flex-col bg-white/[0.02] border rounded-xl p-4 gap-3 transition-all duration-300 ${
                    isSelected
                      ? "border-white/30 bg-white/[0.05] shadow-[0_0_20px_rgba(255,255,255,0.04)]"
                      : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Label badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${labelColor}`}
                    >
                      Variation {variant.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                  </div>

                  {/* Hook */}
                  <div>
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">
                      Hook
                    </p>
                    <p className="text-white font-semibold text-xs leading-snug line-clamp-2">
                      {variant.hook}
                    </p>
                  </div>

                  {/* Content preview */}
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">
                      Content
                    </p>
                    <p className="text-white/60 text-xs leading-relaxed line-clamp-4">
                      {variant.content}
                    </p>
                  </div>

                  {/* CTA badge */}
                  <div className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-0.5">
                      CTA
                    </p>
                    <p className="text-white/70 text-xs line-clamp-1">{variant.cta}</p>
                  </div>

                  {/* Use This button */}
                  <button
                    onClick={() => handleSelect(variant)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isSelected
                        ? "bg-green-500/20 border border-green-500/30 text-green-400"
                        : "bg-white/[0.06] border border-white/[0.10] text-white hover:bg-white/[0.12] hover:border-white/20 active:scale-95"
                    }`}
                  >
                    {isSelected ? "Selected" : "Use This"}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state (before generation) */}
      {!isLoading && variants.length === 0 && !error && (
        <div className="text-center py-6 text-white/25 text-xs">
          Click &ldquo;Generate 3 Variations&rdquo; to create A/B variants of your post
        </div>
      )}
    </div>
  );
}
