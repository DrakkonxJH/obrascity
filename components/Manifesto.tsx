"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import FloatingShapes from "./FloatingShapes";

gsap.registerPlugin(ScrollTrigger);

const lines = [
  { text: "Obras não atrasam por falta de gente.", highlight: false },
  { text: "Atrasam por falta de sincronia.", highlight: true },
  { text: "Informação morre no caminho.", highlight: false },
  { text: "Nós eliminamos essa distância.", highlight: true },
];

export default function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Split each line into words
      const lineEls = linesRef.current?.querySelectorAll(".man-line");
      const splits: SplitType[] = [];

      lineEls?.forEach((line) => {
        const split = new SplitType(line as HTMLElement, {
          types: "words",
          tagName: "span",
        });
        splits.push(split);

        // Set initial state
        gsap.set(split.words, {
          yPercent: 100,
          opacity: 0,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=280%",
          pin: true,
          scrub: 0.8,
        },
      });

      // Animate each line's words with stagger
      splits.forEach((split, i) => {
        const isHighlight = lines[i].highlight;
        tl.to(
          split.words,
          {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.05,
            ease: "power3.out",
          },
          i * 0.8
        );

        // Dim previous lines slightly
        if (i > 0) {
          tl.to(
            splits[i - 1].words,
            {
              opacity: isHighlight ? 0.4 : 0.7,
              duration: 0.5,
            },
            "<"
          );
        }
      });

      // Image clip reveal
      tl.fromTo(
        ".man-figure",
        { clipPath: "inset(0 0 100% 0)", scale: 1.1 },
        {
          clipPath: "inset(0 0 0% 0)",
          scale: 1,
          duration: 1.5,
          ease: "power3.inOut",
        },
        "-=1"
      ).fromTo(
        ".man-figure img",
        { scale: 1.2 },
        { scale: 1, duration: 2, ease: "power2.out" },
        "<"
      );

      return () => {
        splits.forEach((s) => s.revert());
      };
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="sincronia" className="relative bg-ink overflow-hidden">
      <FloatingShapes variant="dark" density="sparse" />

      <div className="h-screen flex items-center relative z-10">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full grid lg:grid-cols-[1.3fr_1fr] gap-20 items-center">
          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-bronze mb-12 flex items-center gap-4">
              <span className="inline-block w-12 h-px bg-bronze" />
              O problema
            </p>
            <div ref={linesRef} className="space-y-3 md:space-y-5">
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={`man-line overflow-hidden ${
                    l.highlight
                      ? "serif-i text-bronze"
                      : "font-display text-bone"
                  } text-[clamp(1.6rem,4.5vw,3.8rem)] leading-[1.1] font-light tracking-[-0.01em] [&_.word]:inline-block [&_.word]:mr-[0.2em]`}
                >
                  {l.text}
                </div>
              ))}
            </div>
          </div>

          <div className="man-figure hidden lg:block relative h-[65vh] overflow-hidden">
            <img
              src="/images/arch-texture.jpg"
              alt="Detalhe arquitetônico em luz dourada"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />
            {/* Decorative corner accent */}
            <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-bronze/40" />
            <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-bronze/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
