"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useMotionTemplate, animate } from "framer-motion";

export default function BackgroundSystem() {
  const color1 = useMotionValue("#0a0a1a");
  const color2 = useMotionValue("#1a0b2e");
  const color3 = useMotionValue("#000000");

  const bgImage = useMotionTemplate`radial-gradient(120% 120% at 50% 0%, ${color2} 0%, ${color1} 50%, ${color3} 100%)`;

  useEffect(() => {
    animate(color1, ["#0a0a1a", "#1a0b2e", "#050510", "#0a0a1a"], {
      ease: "easeInOut", duration: 25, repeat: Infinity, repeatType: "mirror"
    });
    animate(color2, ["#1a0b2e", "#2d0b3a", "#0f0f2d", "#1a0b2e"], {
      ease: "easeInOut", duration: 30, repeat: Infinity, repeatType: "mirror"
    });
    animate(color3, ["#000000", "#050010", "#000510", "#000000"], {
      ease: "easeInOut", duration: 20, repeat: Infinity, repeatType: "mirror"
    });
  }, [color1, color2, color3]);

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#030303]">
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ backgroundImage: bgImage }}
      />
      <div className="absolute inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
    </div>
  );
}
