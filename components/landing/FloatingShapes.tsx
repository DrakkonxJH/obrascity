"use client";

import { useEffect, useRef, useId } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FloatingShapesProps {
  variant?: "dark" | "light";
  density?: "sparse" | "normal";
}

export default function FloatingShapes({
  variant = "dark",
  density = "normal",
}: FloatingShapesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    // Only run on desktop for performance
    if (window.innerWidth < 1024) return;

    const ctx = gsap.context(() => {
      const shapes = gsap.utils.toArray<HTMLElement>(".float-shape");

      shapes.forEach((shape, i) => {
        // Continuous float animation
        gsap.to(shape, {
          y: "random(-15, 15)",
          x: "random(-8, 8)",
          rotation: "random(-5, 5)",
          duration: "random(5, 8)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.4,
        });

        // Parallax on scroll
        gsap.to(shape, {
          yPercent: -40 * (i % 2 === 0 ? 1 : -1),
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const strokeColor = variant === "dark" ? "#c9a96e" : "#9a7b45";
  const opacity = variant === "dark" ? 0.12 : 0.18;
  const count = density === "sparse" ? 4 : 6;

  const positions = [
    { top: "12%", left: "6%", size: 70 },
    { top: "28%", right: "10%", size: 55 },
    { top: "55%", left: "12%", size: 45 },
    { top: "72%", right: "8%", size: 60 },
    { top: "88%", left: "5%", size: 50 },
    { top: "42%", right: "4%", size: 75 },
  ].slice(0, count);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block"
      aria-hidden="true"
    >
      {positions.map((pos, i) => (
        <div
          key={`${id}-${i}`}
          className="float-shape absolute will-change-transform"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            width: pos.size,
            height: pos.size,
          }}
        >
          {i % 3 === 0 ? (
            // Wireframe cube
            <svg viewBox="0 0 100 100" fill="none" style={{ opacity }}>
              <path
                d="M20,30 L50,15 L80,30 L80,70 L50,85 L20,70 Z M20,30 L50,45 L80,30 M50,45 L50,85"
                stroke={strokeColor}
                strokeWidth="0.8"
              />
            </svg>
          ) : i % 3 === 1 ? (
            // Wireframe pyramid
            <svg viewBox="0 0 100 100" fill="none" style={{ opacity }}>
              <path
                d="M50,10 L15,75 L50,90 L85,75 Z M50,10 L50,90 M15,75 L85,75"
                stroke={strokeColor}
                strokeWidth="0.8"
              />
            </svg>
          ) : (
            // Concentric circles
            <svg viewBox="0 0 100 100" fill="none" style={{ opacity }}>
              <circle cx="50" cy="50" r="38" stroke={strokeColor} strokeWidth="0.6" />
              <circle cx="50" cy="50" r="26" stroke={strokeColor} strokeWidth="0.5" />
              <circle cx="50" cy="50" r="14" stroke={strokeColor} strokeWidth="0.4" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
