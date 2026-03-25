"use client";
import dynamic from "next/dynamic";

const DottedSurface = dynamic(
  () => import("@/components/ui/dotted-surface").then((mod) => mod.DottedSurface),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
);

export default function BackgroundSystem() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 z-[5]">
        <DottedSurface className="w-full h-full" />
      </div>
    </div>
  );
}
