"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Download,
  Save,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VideoScript {
  platform: string;
  duration: string;
  hook: string;
  script: string;
  visualPrompt: string;
  hashtags: string[];
  aspectRatio: string;
}

interface VideoData {
  videoBytes?: string;
  videoUri?: string;
  mockVideoUrl?: string;
  mock?: boolean;
}

type VideoStatus = "idle" | "generating" | "done" | "error";

interface ScriptVideoState {
  status: VideoStatus;
  videoData?: VideoData;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_TYPES = [
  { id: "blog", label: "Blog Post" },
  { id: "transcript", label: "Transcript" },
  { id: "concept", label: "Concept" },
  { id: "script", label: "Script" },
] as const;

type SourceTypeId = (typeof SOURCE_TYPES)[number]["id"];

// ─── Platform badge colours ────────────────────────────────────────────────────

function platformStyle(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("instagram"))
    return "bg-pink-500/10 border-pink-500/30 text-pink-300";
  if (p.includes("tiktok"))
    return "bg-purple-500/10 border-purple-500/30 text-purple-300";
  if (p.includes("youtube"))
    return "bg-red-500/10 border-red-500/30 text-red-300";
  if (p.includes("linkedin"))
    return "bg-blue-500/10 border-blue-500/30 text-blue-300";
  if (p.includes("twitter") || p.includes("x"))
    return "bg-sky-500/10 border-sky-500/30 text-sky-300";
  return "bg-white/[0.04] border-white/[0.08] text-white/50";
}

// ─── Script Card ──────────────────────────────────────────────────────────────

function ScriptCard({
  script,
  index,
  videoState,
  onGenerateVideo,
  onRetryVideo,
  onSaveToPost,
}: {
  script: VideoScript;
  index: number;
  videoState: ScriptVideoState;
  onGenerateVideo: (index: number) => void;
  onRetryVideo: (index: number) => void;
  onSaveToPost: (script: VideoScript) => void;
}) {
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uriCopied, setUriCopied] = useState(false);

  const PREVIEW_LENGTH = 100;
  const isLong = script.script.length > PREVIEW_LENGTH;
  const displayScript =
    isLong && !scriptExpanded
      ? script.script.slice(0, PREVIEW_LENGTH) + "…"
      : script.script;

  const handleDownloadScript = async () => {
    try {
      await navigator.clipboard.writeText(
        `${script.hook}\n\n${script.script}\n\n${script.hashtags.map((h) => `#${h}`).join(" ")}`
      );
      setCopied(true);
      toast.success("Script copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy script.");
    }
  };

  const handleCopyUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      setUriCopied(true);
      toast.success("URI copied to clipboard!");
      setTimeout(() => setUriCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URI.");
    }
  };

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
            platformStyle(script.platform)
          )}
        >
          {script.platform}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs">
          {script.duration}
        </span>
      </div>

      {/* Hook */}
      <p className="text-white font-semibold text-sm leading-snug">
        {script.hook}
      </p>

      {/* Script preview (collapsible) */}
      <div>
        <p className="text-white/60 text-sm leading-relaxed">{displayScript}</p>
        {isLong && (
          <button
            onClick={() => setScriptExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            {scriptExpanded ? (
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

      {/* Visual Prompt */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex gap-2 items-start">
        <Wand2 className="w-3.5 h-3.5 text-white/40 mt-0.5 shrink-0" />
        <p className="text-white/50 text-xs italic leading-relaxed">
          {script.visualPrompt}
        </p>
      </div>

      {/* Hashtags */}
      {script.hashtags && script.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {script.hashtags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-lg bg-purple-500/[0.08] border border-purple-500/20 text-purple-300/70 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Video Generation Area */}
      <div className="mt-auto">
        {/* Idle or Error states — show generate button */}
        {(videoState.status === "idle" || videoState.status === "error") && (
          <>
            {videoState.status === "error" && (
              <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300/80 text-xs leading-relaxed">
                  {videoState.error || "Video generation failed."}
                </p>
              </div>
            )}
            <button
              onClick={() =>
                videoState.status === "error"
                  ? onRetryVideo(index)
                  : onGenerateVideo(index)
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-medium transition-all duration-200"
            >
              {videoState.status === "error" ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retry Video
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Generate Video
                </>
              )}
            </button>
          </>
        )}

        {/* Generating state */}
        {videoState.status === "generating" && (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            Generating...
          </div>
        )}

        {/* Done state — show video player */}
        {videoState.status === "done" && videoState.videoData && (
          <div className="space-y-3">
            {videoState.videoData.mock && videoState.videoData.mockVideoUrl ? (
              <div className="relative">
                <video
                  controls
                  className="w-full rounded-xl"
                  src={videoState.videoData.mockVideoUrl}
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  Demo video
                </span>
              </div>
            ) : videoState.videoData.videoBytes ? (
              <video
                controls
                className="w-full rounded-xl"
                src={`data:video/mp4;base64,${videoState.videoData.videoBytes}`}
              />
            ) : videoState.videoData.videoUri ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <p className="text-white/60 text-xs leading-relaxed">
                  Video is stored in Google Cloud. Copy URI to download.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-white/40 text-[10px] truncate bg-white/[0.03] px-2 py-1.5 rounded-lg border border-white/[0.06]">
                    {videoState.videoData.videoUri}
                  </code>
                  <button
                    onClick={() => handleCopyUri(videoState.videoData!.videoUri!)}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
                  >
                    {uriCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onSaveToPost(script)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all duration-300"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Posts
              </button>
              <button
                onClick={handleDownloadScript}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all duration-300"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Download Script"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function VideoStudioPage() {
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<SourceTypeId>("blog");
  const [niche, setNiche] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<VideoScript[] | null>(null);

  // Per-script video generation state
  const [videoStates, setVideoStates] = useState<Record<number, ScriptVideoState>>({});

  // Track poll intervals so we can clean them up
  const pollIntervalsRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  // Clean up all intervals on unmount
  useEffect(() => {
    const intervals = pollIntervalsRef.current;
    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, []);

  const reset = () => {
    // Clean up any running polls
    Object.values(pollIntervalsRef.current).forEach(clearInterval);
    pollIntervalsRef.current = {};
    setScripts(null);
    setError(null);
    setVideoStates({});
  };

  const canSubmit = content.trim().length > 0 && !loading;

  // ── Generate Scripts ──────────────────────────────────────────────────────────

  const handleGenerateScripts = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setScripts(null);
    setVideoStates({});

    try {
      const res = await fetch("/api/video/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sourceType, niche }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setScripts(data.scripts || []);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Update a single script's video state ─────────────────────────────────────

  const updateVideoState = (index: number, patch: Partial<ScriptVideoState>) => {
    setVideoStates((prev) => ({
      ...prev,
      [index]: { ...(prev[index] ?? { status: "idle" }), ...patch },
    }));
  };

  // ── Generate Video for a script ───────────────────────────────────────────────

  const handleGenerateVideo = async (index: number) => {
    if (!scripts) return;
    const script = scripts[index];

    updateVideoState(index, { status: "generating", error: undefined });

    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualPrompt: script.visualPrompt,
          aspectRatio: script.aspectRatio,
          platform: script.platform,
          duration: script.duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        updateVideoState(index, {
          status: "error",
          error: data.error || "Failed to start video generation.",
        });
        return;
      }

      // If already done (mock / synchronous response)
      if (data.done || data.mock) {
        updateVideoState(index, {
          status: "done",
          videoData: {
            videoBytes: data.videoBytes,
            videoUri: data.videoUri,
            mockVideoUrl: data.mockVideoUrl,
            mock: data.mock,
          },
        });
        return;
      }

      // Start polling
      const { operationName } = data;
      if (!operationName) {
        updateVideoState(index, {
          status: "error",
          error: "No operation returned from server.",
        });
        return;
      }

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/video/status/${encodeURIComponent(operationName)}`
          );
          const statusData = await statusRes.json();

          if (statusData.done) {
            clearInterval(pollInterval);
            delete pollIntervalsRef.current[index];
            updateVideoState(index, {
              status: "done",
              videoData: {
                videoBytes: statusData.videoBytes,
                videoUri: statusData.videoUri,
                mockVideoUrl: statusData.mockVideoUrl,
                mock: statusData.mock,
              },
            });
          }
        } catch {
          clearInterval(pollInterval);
          delete pollIntervalsRef.current[index];
          updateVideoState(index, {
            status: "error",
            error: "Failed to check video status.",
          });
        }
      }, 5000);

      pollIntervalsRef.current[index] = pollInterval;
    } catch {
      updateVideoState(index, {
        status: "error",
        error: "Network error. Please try again.",
      });
    }
  };

  const handleRetryVideo = (index: number) => {
    handleGenerateVideo(index);
  };

  // ── Save to Posts ─────────────────────────────────────────────────────────────

  const handleSaveToPost = async (script: VideoScript) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `${script.hook}\n\n${script.script}\n\n${script.hashtags.map((h) => `#${h}`).join(" ")}`,
          platforms: [script.platform],
          status: "draft",
        }),
      });

      if (res.ok) {
        toast.success("Saved to posts as draft!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save post.");
      }
    } catch {
      toast.error("Network error. Failed to save post.");
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/20">
              <Video className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">
              Video Studio
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-14">
            Turn your content into viral short-form videos with AI
          </p>
        </motion.div>

        <div className="space-y-6">

          {/* ── Step 1: Input card (shown when no scripts yet) ─────────────── */}
          <AnimatePresence>
            {!scripts && (
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
                    Your Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your blog post, article, podcast transcript, or just describe your video idea..."
                    className="w-full min-h-[180px] bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 resize-y transition-colors leading-relaxed"
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

                {/* Niche input */}
                <div className="mb-8">
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Your niche{" "}
                    <span className="text-white/30 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. 'fitness coaching'"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 flex items-start gap-2 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-red-300 text-sm">{error}</p>
                      <button
                        onClick={handleGenerateScripts}
                        className="mt-2 text-red-400/70 hover:text-red-400 text-xs underline underline-offset-2 transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleGenerateScripts}
                  disabled={!canSubmit}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                    canSubmit
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-900/20"
                      : "bg-white/[0.04] border border-white/[0.06] text-white/30 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="animate-pulse">
                        Generating 5 platform-optimized scripts...
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Generate Video Scripts
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 2: Script cards ───────────────────────────────────────── */}
          <AnimatePresence>
            {scripts && (
              <motion.div
                key="scripts-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                {/* Summary bar */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-white/60 text-sm">
                    <span className="text-white font-semibold">
                      {scripts.length} scripts ready
                    </span>{" "}
                    · Choose one to generate your video
                  </p>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-xs font-medium transition-all duration-200"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Start Over
                  </button>
                </div>

                {/* Script grid — 5th card centred on xl */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {scripts.map((script, i) => {
                    const isLastOdd =
                      scripts.length % 3 !== 0 &&
                      i === scripts.length - 1 &&
                      scripts.length > 3;
                    return (
                      <div
                        key={i}
                        className={clsx(
                          isLastOdd && "xl:col-start-2"
                        )}
                      >
                        <ScriptCard
                          script={script}
                          index={i}
                          videoState={videoStates[i] ?? { status: "idle" }}
                          onGenerateVideo={handleGenerateVideo}
                          onRetryVideo={handleRetryVideo}
                          onSaveToPost={handleSaveToPost}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
