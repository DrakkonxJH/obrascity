"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const panels = [
  {
    n: "01",
    title: "Tempo real",
    body: "O progresso da obra atualizado no instante em que acontece. Sem ruído.",
    img: "/images/dashboard-mockup.jpg",
    alt: "Dashboard ObrasCity",
  },
  {
    n: "02",
    title: "BIM 3D integrado",
    body: "Antecipe conflitos de projeto antes do primeiro traço de concreto.",
    img: "/images/work-tower.jpg",
    alt: "Torre em construção",
  },
  {
    n: "03",
    title: "Finanças transparentes",
    body: "Orçamento, medições e caixa lado a lado. Cada centavo visível.",
    img: "/images/work-interior.jpg",
    alt: "Interior de obra com luz dourada",
  },
  {
    n: "04",
    title: "Suprimentos sob controle",
    body: "O material certo, na hora certa. Desperdício eliminado pela raiz.",
    img: "/images/engineer-tablet.jpg",
    alt: "Engenheiro com tablet no canteiro",
  },
];

export default function Capabilities() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip horizontal scroll on mobile
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const ctx = gsap.context(() => {
        const track = trackRef.current;
        if (!track) return;

        const getScrollAmount = () => track.scrollWidth - window.innerWidth;

        const tween = gsap.to(track, {
          x: () => -getScrollAmount(),
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: () => `+=${getScrollAmount()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressRef.current) {
                progressRef.current.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
        });

        // Parallax on each panel image
        gsap.utils.toArray<HTMLElement>(".cap-img").forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -10 },
            {
              xPercent: 10,
              ease: "none",
              scrollTrigger: {
                trigger: img.parentElement,
                containerAnimation: tween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            }
          );
        });
      }, rootRef);

      return () => ctx.revert();
    });

    // Mobile: simple fade-in cards
    mm.add("(max-width: 767px)", () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".cap-card").forEach((card, i) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: i * 0.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                once: true,
              },
            }
          );
        });
      }, rootRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="plataforma"
      className="relative bg-ink overflow-hidden"
    >
      {/* Desktop: horizontal scroll */}
      <div className="hidden md:flex h-screen flex-col justify-center">
        {/* Header */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full mb-10 flex items-end justify-between">
          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
              <span className="inline-block w-10 h-px bg-bronze" />
              A plataforma
            </p>
            <h2 className="font-display font-light text-bone text-[clamp(1.9rem,3.6vw,3.2rem)] leading-tight">
              Um ecossistema.{" "}
              <span className="serif-i text-bronze">Quatro pilares.</span>
            </h2>
          </div>
          <div className="hidden md:block w-40 h-px bg-bone/15 relative overflow-hidden mb-3">
            <div
              ref={progressRef}
              className="absolute inset-0 bg-bronze origin-left scale-x-0"
            />
          </div>
        </div>

        {/* Horizontal track */}
        <div
          ref={trackRef}
          className="flex gap-8 md:gap-14 pl-6 md:pl-12 pr-[12vw] w-max"
        >
          {panels.map((p) => (
            <article key={p.n} className="cap-card group w-[46vw] shrink-0">
              <div className="relative h-[52vh] overflow-hidden bg-coal">
                <img
                  src={p.img}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className="cap-img absolute inset-0 w-[120%] max-w-none h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute top-5 left-6 text-[11px] tracking-[0.35em] text-bone/80 bg-ink/30 px-2 py-1 backdrop-blur-sm rounded">
                  {p.n}
                </span>
              </div>
              <div className="pt-6 border-t border-bone/10 mt-6">
                <h3 className="font-display font-light text-bone text-3xl md:text-4xl mb-3">
                  {p.title}
                </h3>
                <p className="text-bone-dim text-[15px] leading-relaxed max-w-sm">
                  {p.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Mobile: vertical cards */}
      <div className="md:hidden py-20 px-6">
        <div className="mb-12">
          <p className="text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
            <span className="inline-block w-10 h-px bg-bronze" />
            A plataforma
          </p>
          <h2 className="font-display font-light text-bone text-3xl leading-tight">
            Um ecossistema.{" "}
            <span className="serif-i text-bronze">Quatro pilares.</span>
          </h2>
        </div>

        <div className="space-y-8">
          {panels.map((p) => (
            <article key={p.n} className="cap-card">
              <div className="relative h-[45vh] overflow-hidden bg-coal mb-5">
                <img
                  src={p.img}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 text-[11px] tracking-[0.35em] text-bone/80 bg-ink/40 px-2 py-1 backdrop-blur-sm rounded">
                  {p.n}
                </span>
              </div>
              <h3 className="font-display font-light text-bone text-2xl mb-2">
                {p.title}
              </h3>
              <p className="text-bone-dim text-sm leading-relaxed">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
