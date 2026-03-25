"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Psychology: Bandwagon Effect + Social Proof (Cialdini, 1984)
 * Live activity counter creates urgency and FOMO — "others are using this right now."
 * Animated counter makes it feel real-time even when fetched periodically.
 */

function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;

    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevTarget.current = target;
  }, [target, duration]);

  return count;
}

export default function SocialProofBar() {
  const [metrics, setMetrics] = useState({ postsToday: 0, activeNow: 0 });

  useEffect(() => {
    // Fetch public metrics (no auth required)
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/metrics/public");
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            postsToday: data.postsToday || 0,
            activeNow: data.activeNow || 0,
          });
        }
      } catch {
        // Fail silently — social proof is enhancement, not critical
      }
    }

    fetchMetrics();
    // Refresh every 60s to keep it feeling live
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const animatedPosts = useAnimatedCounter(metrics.postsToday);
  const animatedActive = useAnimatedCounter(metrics.activeNow);

  // Don't render if no data yet (avoid showing "0 posts generated today")
  if (metrics.postsToday === 0 && metrics.activeNow === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="flex items-center justify-center gap-6 py-3"
    >
      {metrics.postsToday > 0 && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-sm text-white/50">
            <span className="text-white font-medium">{animatedPosts.toLocaleString()}</span> posts generated today
          </span>
        </div>
      )}
      {metrics.activeNow > 0 && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <span className="text-sm text-white/50">
            <span className="text-white font-medium">{animatedActive}</span> creators active now
          </span>
        </div>
      )}
    </motion.div>
  );
}
