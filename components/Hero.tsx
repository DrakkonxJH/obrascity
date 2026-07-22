"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import dynamic from "next/dynamic";
import { scrollStore } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const Building3D = dynamic(() => import("./Building3D"), { ssr: false });

export default function Hero({ ready }: { ready: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const kickerRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  /* Text splitting + stagger reveal */
  useEffect(() => {
    if (!ready || !titleRef.current) return;

    // Split text into chars
    const split = new SplitType(titleRef.current, {
      types: "lines,words,chars",
      tagName: "span",
    });

    const chars = split.chars || [];
    const words = split.words || [];

    // Set initial state
    gsap.set(chars, { yPercent: 110, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Stagger chars in
    tl.to(chars, {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.02,
    })
      .fromTo(
        kickerRef.current,
        { opacity: 0, y: 22, clipPath: "inset(0 100% 0 0)" },
        { opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)", duration: 0.9 },
        0.3
      )
      .fromTo(
        metaRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1 },
        0.6
      )
      .fromTo(
        bgRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" },
        0
      );

    // Add magnetic effect to words on hover
    const handlers: Array<{ el: HTMLElement; enter: () => void; leave: () => void }> = [];
    words.forEach((word) => {
      const enter = () => {
        gsap.to(word, { scale: 1.05, color: "#c9a96e", duration: 0.3, ease: "power2.out" });
      };
      const leave = () => {
        gsap.to(word, { scale: 1, color: "", duration: 0.4, ease: "power2.out" });
      };
      word.addEventListener("mouseenter", enter);
      word.addEventListener("mouseleave", leave);
      handlers.push({ el: word, enter, leave });
    });

    return () => {
      handlers.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      split.revert();
      tl.kill();
    };
  }, [ready]);

  /* Scroll-driven parallax */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(bgRef.current, {
        yPercent: 22,
        scale: 1.15,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(titleRef.current, {
        yPercent: -50,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "60% top",
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* Magnetic CTA */
  const magnet = (e: React.MouseEvent) => {
    const el = ctaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * 0.35,
      y: (e.clientY - (r.top + r.height / 2)) * 0.4,
      duration: 0.4,
      ease: "power3.out",
    });
  };
  const release = () => {
    if (!ctaRef.current) return;
    gsap.to(ctaRef.current, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.3)",
    });
  };

  return (
    <section
      ref={rootRef}
      id="topo"
      className="relative h-[100svh] min-h-[700px] overflow-hidden"
    >
      {/* 3D background */}
      <div ref={bgRef} className="absolute inset-0 opacity-0">
        <Building3D />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0e0d0b_88%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink via-ink/80 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col justify-end pb-28 md:pb-24 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        {/* Kicker with line reveal */}
        <div className="mb-8 overflow-hidden" ref={kickerRef} style={{ opacity: 0 }}>
          <p className="text-[11px] tracking-[0.4em] uppercase text-bronze flex items-center gap-4">
            <span className="inline-block w-12 h-px bg-bronze" />
            Plataforma de gestão de obras
            <span className="inline-block w-12 h-px bg-bronze" />
          </p>
        </div>

        {/* Title with char split */}
        <h1
          ref={titleRef}
          className="font-display font-light text-bone leading-[0.95] tracking-[-0.03em] text-[clamp(2.8rem,9vw,8.5rem)] max-w-[15ch] [&_.word]:inline-block [&_.word]:mr-[0.25em] [&_.word]:cursor-default [&_.char]:inline-block"
        >
          Campo e escritório, em perfeita sincronia.
        </h1>

        <div
          className="mt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-10"
          ref={metaRef}
          style={{ opacity: 0 }}
        >
          <p className="text-bone-dim text-base md:text-lg leading-relaxed max-w-md">
            A ObrasCity atualiza o escritório no instante em que a obra acontece.
          </p>

          <a
            ref={ctaRef}
            href="#contato"
            onMouseMove={magnet}
            onMouseLeave={release}
            onClick={(e) => {
              e.preventDefault();
              scrollStore.lenis?.scrollTo("#contato");
            }}
            className="group relative inline-flex items-center gap-4 border border-bone/20 rounded-full pl-8 pr-3 py-3.5 hover:border-bronze/50 transition-colors duration-500 w-fit overflow-hidden"
          >
            {/* Hover fill */}
            <span className="absolute inset-0 bg-bronze translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out rounded-full" />
            <span className="relative text-[13px] tracking-[0.18em] uppercase text-bone group-hover:text-ink transition-colors duration-300">
              Agendar demonstração
            </span>
            <span className="relative w-11 h-11 rounded-full bg-bronze text-ink grid place-items-center transition-transform duration-500 group-hover:rotate-45 group-hover:bg-ink group-hover:text-bronze">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 17L17 7M17 7H8M17 7V16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        </div>
      </div>

      {/* Bottom strip with animated line */}
      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-bone/10 pointer-events-none">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-bone-dim">
          <span>São Paulo — Brasil</span>
          <div className="hidden md:flex flex-col items-center gap-2">
            <span>Scroll</span>
            <span className="scroll-cue block w-px h-8 bg-gradient-to-b from-bronze to-transparent" />
          </div>
          <span>Est. 2019</span>
        </div>
      </div>
    </section>
  );
}
