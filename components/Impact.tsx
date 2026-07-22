"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 40, suffix: "%", label: "Potencial de redução de custos*" },
  { value: 15, suffix: "h", label: "Economia semanal estimada*" },
  { value: 99, suffix: ".9%", label: "Disponibilidade da plataforma" },
];

export default function Impact() {
  const rootRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax on background image
      gsap.fromTo(
        bgRef.current,
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // Count-up animation on enter
      gsap.utils.toArray<HTMLElement>(".stat-value").forEach((el) => {
        const target = Number(el.dataset.value || 0);
        const obj = { v: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              v: target,
              duration: 2,
              ease: "power3.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.v));
              },
            });
          },
        });
      });

      // Fade rows in with stagger
      gsap.utils.toArray<HTMLElement>(".stat-row").forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          }
        );
      });

      // Header animation
      gsap.fromTo(
        ".impact-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden">
      {/* Parallax background */}
      <div
        ref={bgRef}
        className="absolute inset-[-15%] will-change-transform"
      >
        <img
          src="/images/crane-sunset.jpg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/80" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-32 md:py-44">
        <p className="impact-header text-[11px] tracking-[0.4em] uppercase text-bronze mb-16 flex items-center gap-4">
          <span className="inline-block w-10 h-px bg-bronze" />
          Potencial de impacto
        </p>

        <div className="divide-y divide-bone/10 border-y border-bone/10">
          {stats.map((s, index) => (
            <div
              key={s.label}
              className="stat-row grid grid-cols-1 md:grid-cols-[auto_1fr] items-baseline gap-4 md:gap-x-12 py-8 md:py-12"
            >
              <div className="font-display font-light text-bone leading-none text-[clamp(3.2rem,10vw,8rem)] tabular-nums">
                <span className="stat-value" data-value={s.value}>
                  0
                </span>
                <span className="text-bronze">{s.suffix}</span>
              </div>
              <p className="text-bone-dim text-sm md:text-base tracking-[0.08em] uppercase order-first md:order-none">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-[9px] tracking-[0.1em] uppercase text-bone/30 text-center">
          * Estimativas baseadas em benchmarks do setor. Resultados podem variar conforme o projeto.
        </p>
      </div>
    </section>
  );
}
