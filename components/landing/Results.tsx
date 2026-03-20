"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { scrollReveal } from "@/lib/motion";
import { Zap, Globe, Clock, TrendingUp } from "lucide-react";

const stats = [
  {
    label: "Posts generated",
    value: 47000,
    suffix: "+",
    icon: Zap,
    description: "AI-powered posts created by our users",
  },
  {
    label: "Platforms supported",
    value: 6,
    suffix: "",
    icon: Globe,
    description: "Publish everywhere with one click",
  },
  {
    label: "Avg. hours saved/week",
    value: 4.2,
    suffix: "",
    icon: Clock,
    description: "Time founders get back every week",
    decimals: 1,
  },
  {
    label: "Avg. engagement increase",
    value: 340,
    suffix: "%",
    icon: TrendingUp,
    description: "Compared to manual posting",
  },
];

function AnimatedCounter({ value, suffix = "", decimals = 0, inView }: { value: number; suffix?: string; decimals?: number; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setCount(current);

      if (step >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [inView, value]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return (
    <span>
      {display}{suffix}
    </span>
  );
}

export default function Results() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div {...scrollReveal} className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-medium leading-7 text-white/60">By the numbers</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Founders are shipping content faster than ever
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="group text-center bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-8 hover:border-white/20 transition-all duration-500 relative overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative z-10">
                <div className="mx-auto w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-cyan-500/10 transition-all duration-300">
                  <stat.icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors duration-300" />
                </div>

                <div className="text-4xl font-light text-white mb-2 tracking-tight">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                    inView={inView}
                  />
                </div>

                <p className="text-sm font-medium text-white/60 mb-1">{stat.label}</p>
                <p className="text-xs text-white/30">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
