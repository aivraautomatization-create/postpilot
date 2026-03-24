"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  RefreshCw,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RepurposedPost {
  platform: string;
  format: string;
  hook: string;
  content: string;
  cta: string;
  hashtags: string[];
  tips: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_TYPES = [
  { id: "blog", label: "Blog Post" },
  { id: "transcript", label: "Video Transcript" },
  { id: "script", label: "Podcast Script" },
  { id: "tweet", label: "Social Post" },
] as const;

type SourceTypeId = (typeof SOURCE_TYPES)[number]["id"];

const PLATFORMS = [
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Twitter/X",
  "Facebook",
  "YouTube",
];

const TONES = [
  { id: "match", label: "Match my brand voice" },
  { id: "Professional", label: "Professional" },
  { id: "Casual", label: "Casual" },
  { id: "Inspirational", label: "Inspirational" },
  { id: "Humorous", label: "Humorous" },
] as const;

type ToneId = (typeof TONES)[number]["id"];

// ─── Platform badge colours ────────────────────────────────────────────────────

function platformStyle(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("instagram"))
    return "bg-pink-500/10 border-pink-500/30 text-pink-300";
  if (p.includes("linkedin"))
    return "bg-blue-500/10 border-blue-500/30 text-blue-300";
  if (p.includes("tiktok"))
    return "bg-white/[0.06] border-white/20 text-white/70";
  if (p.includes("twitter") || p.includes("/x"))
    return "bg-sky-500/10 border-sky-500/30 text-sky-300";
  if (p.includes("facebook"))
    return "bg-indigo-500/10 border-indigo-500/30 text-indigo-300";
  if (p.includes("youtube"))
    return "bg-red-500/10 border-red-500/30 text-red-300";
  return "bg-white/[0.04] border-white/[0.08] text-white/50";
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-white/[0.06] rounded-full" />
        <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
        <div className="h-4 bg-white/[0.04] rounded-lg w-full" />
        <div className="h-4 bg-white/[0.04] rounded-lg w-5/6" />
      </div>
      <div className="h-10 bg-white/[0.03] rounded-xl" />
      <div className="flex gap-2">
        <div className="h-5 w-12 bg-white/[0.04] rounded-full" />
        <div className="h-5 w-14 bg-white/[0.04] rounded-full" />
        <div className="h-5 w-10 bg-white/[0.04] rounded-full" />
      </div>
    </div>
  );
}

// ─── Single post card ──────────────────────────────────────────────────────────

function PostCard({ post, index }: { post: RepurposedPost; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const PREVIEW_LENGTH = 120;
  const isLong = post.content.length > PREVIEW_LENGTH;
  const displayContent =
    isLong && !expanded
      ? post.content.slice(0, PREVIEW_LENGTH) + "…"
      : post.content;

  const handleCopy = async () => {
    const fullText = [
      post.hook,
      "",
      post.content,
      "",
      post.cta,
      "",
      post.hashtags.map((h) => `#${h}`).join(" "),
    ]
      .join("\n")
      .trim();

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please copy manually.");
    }
  };

  const prefillParam = encodeURIComponent(
    JSON.stringify({
      hook: post.hook,
      content: post.content,
      platform: post.platform,
    })
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 hover:border-white/20 transition-all duration-300 flex flex-col gap-4"
    >
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={clsx(
            "inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium",
            platformStyle(post.platform)
          )}
        >
          {post.platform}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs">
          {post.format}
        </span>
      </div>

      {/* Hook */}
      <p className="text-white font-semibold text-sm leading-snug">
        {post.hook}
      </p>

      {/* Content (collapsible) */}
      <div>
        <p className="text-white/60 text-sm leading-relaxed">{displayContent}</p>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show more
              </>
            )}
          </button>
        )}
      </div>

      {/* CTA box */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1 font-medium">
          CTA
        </p>
        <p className="text-white/60 text-xs">{post.cta}</p>
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-lg bg-purple-500/[0.08] border border-purple-500/20 text-purple-300/70 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Tips */}
      {post.tips && (
        <p className="text-white/40 text-xs italic leading-relaxed">
          {post.tips}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-auto pt-1">
        <Link
          href={`/dashboard/create?prefill=${prefillParam}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all duration-300"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit &amp; Schedule
        </Link>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all duration-300"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function RepurposePage() {
  // Form state
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<SourceTypeId>("blog");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState<ToneId>("match");

  // Async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<RepurposedPost[] | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const canSubmit =
    content.trim().length > 0 && selectedPlatforms.length > 0 && !loading;

  const reset = () => {
    setPosts(null);
    setError(null);
    setSavedCount(0);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleRepurpose = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setPosts(null);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sourceType,
          targetPlatforms: selectedPlatforms,
          tone: tone === "match" ? undefined : tone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setPosts(data.posts || []);
      setSavedCount(data.savedCount || 0);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
              <RefreshCw className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">
              Content Repurposer
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-14">
            Turn one piece of content into platform-optimised posts across every
            channel — instantly
          </p>
        </motion.div>

        <div className="space-y-6">

          {/* ── Step 1: Input card ──────────────────────────────────────────── */}
          <AnimatePresence>
            {!posts && (
              <motion.div
                key="input-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500"
              >
                {/* Textarea */}
                <div className="mb-6">
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Paste your content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your blog post, video transcript, podcast notes, LinkedIn article..."
                    className="w-full min-h-[200px] bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 resize-y transition-colors leading-relaxed"
                  />
                </div>

                {/* Source type */}
                <div className="mb-6">
                  <p className="text-white/60 text-sm font-medium mb-3">
                    Content type
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SOURCE_TYPES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSourceType(st.id)}
                        className={clsx(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
                          sourceType === st.id
                            ? "bg-white/[0.08] border-white/20 text-white"
                            : "border-white/[0.04] text-white/40 hover:text-white/70 hover:border-white/10"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform selector */}
                <div className="mb-6">
                  <p className="text-white/60 text-sm font-medium mb-3">
                    Target platforms
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PLATFORMS.map((platform) => {
                      const active = selectedPlatforms.includes(platform);
                      return (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(platform)}
                          className={clsx(
                            "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-white/[0.08] border-white/20 text-white"
                              : "border-white/[0.04] text-white/40 hover:text-white/70 hover:border-white/10"
                          )}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone selector */}
                <div className="mb-8">
                  <p className="text-white/60 text-sm font-medium mb-3">
                    Tone
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={clsx(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
                          tone === t.id
                            ? "bg-white/[0.08] border-white/20 text-white"
                            : "border-white/[0.04] text-white/40 hover:text-white/70 hover:border-white/10"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={canSubmit ? { scale: 1.01 } : {}}
                  whileTap={canSubmit ? { scale: 0.99 } : {}}
                  onClick={handleRepurpose}
                  disabled={!canSubmit}
                  className={clsx(
                    "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300",
                    canSubmit
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-900/30"
                      : "bg-white/[0.04] border border-white/[0.06] text-white/30 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Repurposing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Repurpose Content
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading state ────────────────────────────────────────────────── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Animated label */}
                <div className="flex items-center gap-2 mb-5">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <motion.p
                    className="text-white/50 text-sm"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Repurposing your content across platforms…
                  </motion.p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error state ──────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && !loading && (
              <motion.div
                key="error-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-500/[0.05] border border-red-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={handleRepurpose}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-sm font-medium transition-all duration-300 whitespace-nowrap"
                >
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ──────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {posts && !loading && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Summary bar */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        Generated {posts.length}{" "}
                        {posts.length === 1 ? "post" : "posts"}
                      </p>
                      <p className="text-white/40 text-xs">
                        {savedCount > 0
                          ? `${savedCount} saved as drafts`
                          : "Ready to copy or schedule"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/calendar"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all duration-300"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      View in Calendar
                    </Link>
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 text-xs font-medium transition-all duration-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Repurpose Again
                    </button>
                  </div>
                </motion.div>

                {/* Post grid */}
                {posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map((post, i) => (
                      <PostCard key={i} post={post} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">
                      No posts were generated. Try again with different content
                      or platforms.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
