"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStore } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Split wordmark into individual letters
      const wordmark = wordmarkRef.current;
      if (wordmark) {
        const letters = wordmark.querySelectorAll("span");
        
        gsap.fromTo(
          letters,
          {
            yPercent: 100,
            opacity: 0,
          },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.04,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Parallax on wordmark
      gsap.to(wordmarkRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const wordmark = "OBRASCITY";

  return (
    <footer
      ref={rootRef}
      className="relative bg-ink border-t border-bone/10 overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c9a96e 1px, transparent 1px), linear-gradient(90deg, #c9a96e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 pt-20 pb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.3em] uppercase text-bone-dim">
              © 2026 AtlasTech · Todos os direitos reservados
            </span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-bone/30">
              São Paulo — Brasil · {time} BRT
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-[11px] tracking-[0.2em] uppercase text-bone-dim hover:text-bronze transition-colors duration-300"
            >
              Privacidade
            </a>
            <a
              href="#"
              className="text-[11px] tracking-[0.2em] uppercase text-bone-dim hover:text-bronze transition-colors duration-300"
            >
              Termos
            </a>
            <button
              onClick={() =>
                scrollStore.lenis
                  ? scrollStore.lenis.scrollTo(0)
                  : window.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="group w-12 h-12 rounded-full border border-bone/15 grid place-items-center text-bone-dim hover:border-bronze hover:text-bronze transition-all duration-300"
              aria-label="Voltar ao topo"
            >
              <svg
                className="transition-transform duration-500 group-hover:-translate-y-1"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 19V5m-6 6 6-6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Monumental wordmark with letter reveal */}
      <div className="relative select-none pointer-events-none px-2 -mb-8 md:-mb-14 overflow-hidden">
        <div
          ref={wordmarkRef}
          className="font-display font-light text-stroke text-center leading-[0.82] text-[clamp(5rem,18vw,19rem)] tracking-tight whitespace-nowrap flex justify-center"
        >
          {wordmark.split("").map((letter, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <span className="inline-block">{letter}</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
