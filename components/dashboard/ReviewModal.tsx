"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Lightbulb,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface AiFeedback {
  score: number;
  verdict: string;
  improvements: string[];
  hook_rating: string;
  cta_rating: string;
}

interface ReviewModalProps {
  postId: string;
  content: string;
  platform: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score > 75
      ? "#4ade80" // green-400
      : score >= 50
      ? "#fbbf24" // amber-400
      : "#f87171"; // red-400

  const bgColor =
    score > 75
      ? "text-green-400"
      : score >= 50
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <span className={`text-2xl font-bold ${bgColor}`}>{score}</span>
    </div>
  );
}

function GradeBadge({ label, grade }: { label: string; grade: string }) {
  const isTopGrade = grade.startsWith("A");
  const isMidGrade = grade.startsWith("B");

  const color = isTopGrade
    ? "bg-green-500/15 text-green-400 border-green-500/25"
    : isMidGrade
    ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
    : "bg-red-500/15 text-red-400 border-red-500/25";

  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl">
      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-lg font-bold px-2.5 py-0.5 rounded-lg border ${color}`}
      >
        {grade}
      </span>
    </div>
  );
}

export default function ReviewModal({
  postId,
  content,
  platform,
  isOpen,
  onClose,
  onApprove,
}: ReviewModalProps) {
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state every time the modal opens
    setFeedback(null);
    setError(null);
    setIsLoading(true);

    const run = async () => {
      try {
        const res = await fetch("/api/generate/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, content, platform }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to get AI review");
        }

        setFeedback(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = () => {
    onApprove();
    onClose();
    toast.success("Post approved and publishing…");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md mx-4 sm:mx-0 bg-[#0d0d0d] border border-white/[0.10] backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <Brain
                      className={`w-4 h-4 text-blue-400 ${
                        isLoading ? "animate-pulse" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-sm">
                      AI Review
                    </h2>
                    <p className="text-white/40 text-xs">
                      Pre-publish content check
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Loading */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                    <div className="relative">
                      <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        Analysing your post…
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Checking hook strength, CTA, and viral potential
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && !isLoading && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">
                        Review failed
                      </p>
                      <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {feedback && !isLoading && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      {/* Score + verdict */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                        <ScoreCircle score={feedback.score} />
                        <div className="flex-1 text-center sm:text-left">
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">
                            Verdict
                          </p>
                          <p className="text-white text-sm leading-relaxed break-words">
                            {feedback.verdict}
                          </p>
                        </div>
                      </div>

                      {/* Grade badges */}
                      <div className="grid grid-cols-2 gap-3">
                        <GradeBadge
                          label="Hook Rating"
                          grade={feedback.hook_rating}
                        />
                        <GradeBadge
                          label="CTA Rating"
                          grade={feedback.cta_rating}
                        />
                      </div>

                      {/* Improvements */}
                      {feedback.improvements.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2.5">
                            Improvements
                          </p>
                          <ul className="space-y-2">
                            {feedback.improvements.map((imp, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="flex items-start gap-2.5 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                              >
                                <div className="p-1 rounded-md bg-amber-500/10 shrink-0 mt-0.5">
                                  <Lightbulb className="w-3 h-3 text-amber-400" />
                                </div>
                                <p className="text-white/70 text-xs leading-relaxed">
                                  {imp}
                                </p>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.08]">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-white/70 text-sm font-medium hover:bg-white/[0.04] hover:text-white transition-all"
                >
                  Revise Post
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Anyway
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
