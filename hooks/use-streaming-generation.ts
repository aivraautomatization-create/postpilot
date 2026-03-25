"use client";

import { useState, useCallback, useRef } from "react";

interface StreamingState {
  /** Accumulated content so far */
  content: string;
  /** True while tokens are arriving */
  isStreaming: boolean;
  /** True while the post-stream Claude review is loading */
  isReviewing: boolean;
  /** Error message if generation failed */
  error: string | null;
  /** Trend data returned after stream completes */
  trends: string | null;
  /** Claude review results (fetched after streaming finishes) */
  review: {
    score: number;
    verdict: string;
    improvements: string[];
    hook_rating: string;
    cta_rating: string;
  } | null;
}

interface GenerateParams {
  topic: string;
  platform: string;
  profile: Record<string, unknown>;
  strategy?: string | null;
  journeyStage?: string;
  suggestedCTAs?: string[];
}

/**
 * Hook for streaming AI content generation.
 *
 * Flow:
 * 1. POST /api/generate/stream → SSE stream, tokens appear as they arrive
 * 2. On stream complete → POST /api/generate/review with full content
 * 3. Returns review (enhanced version, engagement score, suggestions)
 *
 * Perceived speed: <500ms to first token (vs 3-5s full wait).
 */
export function useStreamingGeneration() {
  const [state, setState] = useState<StreamingState>({
    content: "",
    isStreaming: false,
    isReviewing: false,
    error: null,
    trends: null,
    review: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (params: GenerateParams) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      content: "",
      isStreaming: true,
      isReviewing: false,
      error: null,
      trends: null,
      review: null,
    });

    try {
      const res = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      // Handle non-streaming error responses
      if (!res.ok) {
        const errorData = await res.json();
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorData.error || "Generation failed",
        }));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: "No stream available",
        }));
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let trends: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                error: data.error,
              }));
              return;
            }

            if (data.done) {
              trends = data.trends || null;
              continue;
            }

            if (data.text) {
              accumulated += data.text;
              setState((prev) => ({
                ...prev,
                content: accumulated,
                trends,
              }));
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Stream complete — update state
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        trends,
      }));

      // Step 2: Fetch Claude review in background (non-blocking UX)
      if (accumulated) {
        setState((prev) => ({ ...prev, isReviewing: true }));

        try {
          const reviewRes = await fetch("/api/generate/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: accumulated,
              platform: params.platform,
              niche: (params.profile?.niche as string) || "General",
            }),
            signal: controller.signal,
          });

          if (reviewRes.ok) {
            const reviewData = await reviewRes.json();
            setState((prev) => ({
              ...prev,
              isReviewing: false,
              review: {
                score: reviewData.score || 0,
                verdict: reviewData.verdict || "",
                improvements: reviewData.improvements || [],
                hook_rating: reviewData.hook_rating || "",
                cta_rating: reviewData.cta_rating || "",
              },
            }));
          } else {
            setState((prev) => ({ ...prev, isReviewing: false }));
          }
        } catch {
          setState((prev) => ({ ...prev, isReviewing: false }));
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: err?.message || "Unknown error",
      }));
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false, isReviewing: false }));
  }, []);

  return { ...state, generate, abort };
}
