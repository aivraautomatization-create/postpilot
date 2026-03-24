"use client";
import { Waves } from "@/components/ui/wave-background";

export default function BackgroundSystem() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 z-[5]">
        <Waves className="w-full h-full" backgroundColor="#000" strokeColor="#fff" />
      </div>
    </div>
  );
}
