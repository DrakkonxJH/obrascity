"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

export default function Quote() {
  const rootRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    let splitInstance: SplitType | null = null;

    const ctx = gsap.context(() => {
      // Split quote text
      if (quoteRef.current) {
        splitInstance = new SplitType(quoteRef.current, {
          types: "lines,words",
          tagName: "span",
        });

        gsap.fromTo(
          splitInstance.words,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.015,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 65%",
              once: true,
            },
          }
        );
      }

      // Quotation mark pulse
      gsap.to(".quote-mark", {
        scale: 1.05,
        opacity: 0.8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Attribution fade in
      gsap.fromTo(
        ".quote-attr",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 55%",
            once: true,
          },
        }
      );

      // Features stagger
      gsap.fromTo(
        ".feature-item",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".features-strip",
            start: "top 85%",
            once: true,
          },
        }
      );
    }, rootRef);

    return () => {
      splitInstance?.revert();
      ctx.revert();
    };
  }, []);

  const features = [
    "Construtoras",
    "Incorporadoras", 
    "Escritórios de engenharia",
    "Projetistas",
    "Gestores de obra",
  ];

  return (
    <section
      ref={rootRef}
      className="relative bg-bone text-ink py-28 md:py-40 overflow-hidden"
    >
      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-bronze-deep/10 pointer-events-none" />
      <div className="absolute bottom-32 left-16 w-40 h-40 rounded-full border border-bronze-deep/10 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        <span className="quote-mark font-display text-bronze-deep text-8xl md:text-9xl leading-none block mb-6 opacity-60">
          "
        </span>
        <blockquote
          ref={quoteRef}
          className="font-display font-light text-[clamp(1.7rem,4.2vw,3.6rem)] leading-[1.15] [&_.line]:block [&_.line]:overflow-hidden [&_.word]:inline-block [&_.word]:mr-[0.18em]"
        >
          A sincronia entre canteiro e escritório transforma a forma como obras são gerenciadas. Decisões em minutos, não em dias.
        </blockquote>
        <div className="quote-attr mt-12">
          <div className="w-16 h-px bg-bronze-deep/50 mx-auto mb-6" />
          <p className="text-sm tracking-[0.1em] text-ink/60 italic">
            Proposta de valor ObrasCity
          </p>
        </div>

        {/* Features strip - quem usa */}
        <div className="features-strip mt-20 md:mt-28 pt-12 border-t border-ink/10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-ink/40 mb-8">
            Desenvolvido para
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-10 gap-y-3">
            {features.map((name, i) => (
              <span
                key={name}
                className="feature-item flex items-center gap-6 md:gap-10"
              >
                <span className="font-display italic text-base md:text-lg text-ink/50 hover:text-ink transition-colors duration-300 cursor-default">
                  {name}
                </span>
                {i < features.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-bronze-deep/40 hidden md:block" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
