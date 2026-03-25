"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1.5,
  cooldownTime = 1,
  className,
  textClassName
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const animationIdRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!texts || texts.length === 0) return;

    let textIndex = 0;
    let time = Date.now();
    let morph = 0;
    let cooldown = cooldownTime;

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        // Text 2 is appearing
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

        // Text 1 is disappearing
        const invFraction = 1 - fraction;
        text1Ref.current.style.filter = `blur(${Math.min(8 / invFraction - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(invFraction, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "0%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "100%";
      }
    };

    const doMorph = () => {
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      const newTime = Date.now();
      const dt = (newTime - time) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (morph === 0) {
          // Start morphing
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[(textIndex - 1 + texts.length) % texts.length];
            text2Ref.current.textContent = texts[textIndex];
          }
        }
        morph += dt;
        if (morph >= morphTime) {
          cooldown = cooldownTime;
          morph = 0;
          doCooldown();
        } else {
          doMorph();
        }
      } else {
        doCooldown();
      }
    }

    // Set initial text
    if (text1Ref.current) text1Ref.current.textContent = texts[0];
    if (text2Ref.current) text2Ref.current.textContent = texts[1] || texts[0];

    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: "url(#threshold)" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center",
            textClassName
          )}
        />
      </div>
    </div>
  );
}
