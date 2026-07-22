"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: "Quanto tempo leva a implantação?",
    a: "De 5 a 10 dias úteis, com migração de dados e treinamento assistidos pela equipe AtlasTech.",
  },
  {
    q: "Funciona offline no canteiro?",
    a: "Sim. O modo offline sincroniza tudo automaticamente quando a conexão retorna.",
  },
  {
    q: "Integra com os softwares que já uso?",
    a: "Revit, AutoCAD, ERPs e contabilidade — com API aberta para integrações sob medida.",
  },
  {
    q: "Como funciona o investimento?",
    a: "Planos escaláveis por obra ativa. Sem módulos escondidos, sem surpresas.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const rootRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = itemsRef.current?.querySelectorAll(".faq-item");

      gsap.fromTo(
        items ?? [],
        { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );

      // Title reveal
      gsap.fromTo(
        ".faq-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
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
    <section ref={rootRef} className="relative bg-ink py-28 md:py-40 overflow-hidden">
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c9a96e 1px, transparent 1px), linear-gradient(90deg, #c9a96e 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 grid md:grid-cols-[1fr_1.6fr] gap-16 md:gap-24">
        <div className="faq-title">
          <p className="text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
            <span className="inline-block w-10 h-px bg-bronze" />
            Perguntas
          </p>
          <h2 className="font-display font-light text-bone text-[clamp(1.9rem,3.6vw,3.2rem)] leading-tight">
            Direto ao{" "}
            <span className="serif-i text-bronze">ponto.</span>
          </h2>
          <p className="text-bone-dim text-sm mt-6 max-w-xs leading-relaxed">
            Respostas claras para as dúvidas mais comuns sobre implementação,
            integração e investimento.
          </p>
        </div>

        <div
          ref={itemsRef}
          className="divide-y divide-bone/10 border-y border-bone/10"
        >
          {faqs.map((f, i) => (
            <div key={i} className="faq-item">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-7 text-left group"
              >
                <span className="flex items-center gap-4">
                  <span className="text-bronze/50 text-sm font-light">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-bone text-base md:text-lg font-light group-hover:text-bronze transition-colors duration-300">
                    {f.q}
                  </span>
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="text-bronze text-2xl font-light leading-none shrink-0 w-8 h-8 border border-bronze/30 rounded-full grid place-items-center group-hover:bg-bronze/10 transition-colors duration-300"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-7 pl-12 pr-10 text-bone-dim text-[15px] leading-relaxed">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
