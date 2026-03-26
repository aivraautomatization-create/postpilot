"use client";
import dynamic from "next/dynamic";

const DottedSurface = dynamic(
  () => import("@/components/ui/dotted-surface").then((mod) => mod.DottedSurface),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
);

export default function BackgroundSystem() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#0F1115]">
      {/* Subtle cyan radial glow — top center */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,191,255,0.07) 0%, transparent 70%)' }} />
      {/* Warm gold accent — bottom right */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 40% at 85% 90%, rgba(192,138,70,0.05) 0%, transparent 60%)' }} />
      {/* Noise texture */}
      <div className="absolute inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.025] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 z-[5]">
        <DottedSurface className="w-full h-full" />
      </div>
    </div>
  );
}
