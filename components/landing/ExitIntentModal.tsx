"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Zap, Clock } from "lucide-react";

export default function ExitIntentModal() {
  const [show, setShow] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !sessionStorage.getItem("exit-intent-shown")) {
      setShow(true);
      sessionStorage.setItem("exit-intent-shown", "1");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseout", handleMouseLeave);
    return () => document.removeEventListener("mouseout", handleMouseLeave);
  }, [handleMouseLeave]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[#0a0a0a] border border-white/[0.1] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/[0.06] rounded-full flex items-center justify-center border border-white/[0.08]">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-light text-white">
            Wait — don&apos;t leave empty-handed
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Your 14-day free trial includes AI post generation, multi-platform
            publishing, video creation, and analytics. No credit card required.
          </p>

          <div className="space-y-3 pt-2">
            <a
              href="/auth/signup"
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              Start Free Trial
            </a>
            <button
              onClick={() => setShow(false)}
              className="w-full text-white/40 hover:text-white/60 text-sm py-2 transition-colors"
            >
              No thanks, I&apos;ll pass
            </button>
          </div>

          <p className="text-white/20 text-xs">
            Businesses using Puls save 14+ hrs/week on content creation
          </p>
        </div>
      </div>
    </div>
  );
}
