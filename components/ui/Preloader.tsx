"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { scrollStore } from "@/lib/scroll";

export default function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const curtainTopRef = useRef<HTMLDivElement>(null);
  const curtainBotRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const handleComplete = useCallback(() => {
    document.body.style.overflow = "";
    setGone(true);
    scrollStore.lenis?.start();
    onDone();
  }, [onDone]);

  useEffect(() => {
    // Prevent scroll during preloader
    scrollStore.lenis?.stop();
    document.body.style.overflow = "hidden";

    const paths = logoRef.current?.querySelectorAll("path");
    const words = wordsRef.current?.querySelectorAll("span");

    if (!paths || !words) {
      // Fallback if elements don't exist
      handleComplete();
      return;
    }

    // Set initial state for SVG paths (stroke draw)
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        fill: "transparent",
      });
    });

    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: handleComplete });
    timelineRef.current = tl;

    // Phase 1: Draw SVG logo
    tl.to(Array.from(paths), {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.inOut",
      stagger: 0.08,
    })
      // Phase 2: Fill logo
      .to(
        Array.from(paths),
        {
          fill: "#c9a96e",
          stroke: "transparent",
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      )
      // Phase 3: Counter
      .to(
        counter,
        {
          v: 100,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(Math.round(counter.v));
            }
          },
        },
        "-=0.6"
      )
      // Phase 4: Words reveal stagger
      .fromTo(
        Array.from(words),
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
        },
        "-=0.5"
      )
      // Phase 5: Brief pause
      .to({}, { duration: 0.25 })
      // Phase 6: Split curtain reveal
      .to(
        curtainTopRef.current,
        {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
        },
        "reveal"
      )
      .to(
        curtainBotRef.current,
        {
          yPercent: 100,
          duration: 0.9,
          ease: "power4.inOut",
        },
        "reveal"
      )
      .to(
        rootRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power2.out",
        },
        "-=0.2"
      );

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [handleComplete]);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Split curtains */}
      <div
        ref={curtainTopRef}
        className="absolute inset-x-0 top-0 h-1/2 bg-ink"
      />
      <div
        ref={curtainBotRef}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo SVG - architectural O with dot */}
        <svg
          ref={logoRef}
          width="100"
          height="100"
          viewBox="0 0 120 120"
          fill="none"
          className="mb-6"
          aria-hidden="true"
        >
          {/* Letter O - architectural serif style */}
          <path
            d="M60 15C35.1472 15 15 35.1472 15 60C15 84.8528 35.1472 105 60 105C84.8528 105 105 84.8528 105 60C105 35.1472 84.8528 15 60 15ZM60 25C79.33 25 95 40.67 95 60C95 79.33 79.33 95 60 95C40.67 95 25 79.33 25 60C25 40.67 40.67 25 60 25Z"
            stroke="#c9a96e"
            strokeWidth="1.5"
            fill="transparent"
          />
          {/* Inner geometric detail */}
          <path
            d="M60 35C46.1929 35 35 46.1929 35 60C35 73.8071 46.1929 85 60 85C73.8071 85 85 73.8071 85 60C85 46.1929 73.8071 35 60 35Z"
            stroke="#c9a96e"
            strokeWidth="0.5"
            fill="transparent"
          />
          {/* Bronze dot accent */}
          <path
            d="M92 90C92 94.4183 88.4183 98 84 98C79.5817 98 76 94.4183 76 90C76 85.5817 79.5817 82 84 82C88.4183 82 92 85.5817 92 90Z"
            stroke="#c9a96e"
            strokeWidth="1.5"
            fill="transparent"
          />
        </svg>

        {/* Counter */}
        <div className="flex items-end gap-1 text-bone mb-5">
          <span
            ref={counterRef}
            className="font-display text-5xl md:text-6xl leading-none font-light tabular-nums"
          >
            0
          </span>
          <span className="text-bone-dim text-lg mb-1">%</span>
        </div>

        {/* Staggered words */}
        <div ref={wordsRef} className="flex gap-3 overflow-hidden">
          {["ATLAS", "TECH", "·", "OBRAS", "CITY"].map((word, i) => (
            <span
              key={i}
              className={`block text-[10px] tracking-[0.35em] uppercase ${
                word === "·" ? "text-bronze" : "text-bone-dim"
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
