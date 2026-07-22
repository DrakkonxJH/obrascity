"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const items = [
  "RDO em tempo real",
  "BIM 3D",
  "Gestão financeira",
  "Suprimentos",
  "CRM de obras",
  "Cronograma vivo",
  "Relatórios automáticos",
  "Integração Revit",
];

export default function Marquee() {
  const rootRef = useRef<HTMLElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax vertical offset based on scroll
      gsap.fromTo(
        track1Ref.current,
        { y: 30 },
        {
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
      gsap.fromTo(
        track2Ref.current,
        { y: -20 },
        {
          y: 20,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const row = [...items, ...items, ...items];

  return (
    <section
      ref={rootRef}
      className="relative bg-bone text-ink py-10 md:py-14 overflow-hidden select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Edge blur masks */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bone to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bone to-transparent z-10 pointer-events-none" />

      {/* Track 1 - forward */}
      <div
        ref={track1Ref}
        className="flex whitespace-nowrap"
        style={{
          animation: `marquee-forward ${hovered ? "50s" : "25s"} linear infinite`,
        }}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="font-display italic text-2xl md:text-3xl lg:text-4xl font-light px-6 md:px-10 hover:text-bronze-deep transition-colors duration-300 cursor-default">
              {item}
            </span>
            <span className="w-2 h-2 rounded-full bg-bronze-deep/40 shrink-0" />
          </span>
        ))}
      </div>

      {/* Track 2 - reverse, offset */}
      <div
        ref={track2Ref}
        className="flex whitespace-nowrap mt-4 md:mt-6"
        style={{
          animation: `marquee-reverse ${hovered ? "60s" : "30s"} linear infinite`,
        }}
      >
        {[...row].reverse().map((item, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="font-body text-sm md:text-base tracking-[0.15em] uppercase text-ink/50 px-6 md:px-10 hover:text-ink transition-colors duration-300 cursor-default">
              {item}
            </span>
            <span className="w-1 h-1 rounded-full bg-bronze-deep/30 shrink-0" />
          </span>
        ))}
      </div>
    </section>
  );
}
