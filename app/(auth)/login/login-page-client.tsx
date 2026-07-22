"use client";

import "@/app/login-styles.css";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import AuthShell from "@/components/landing/AuthShell";
import { LoginForm } from "./login-form";

export default function LoginPageClient({ nextPath }: { nextPath: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    const split = new SplitType(titleRef.current, { types: "chars", tagName: "span" });
    gsap.fromTo(split.chars, { yPercent: 120, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.025, ease: "power4.out", delay: 0.4,
    });
    gsap.fromTo(".auth-el", { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", delay: 0.7,
    });
    return () => split.revert();
  }, []);

  return (
    <AuthShell
      panelImage="/images/crane-sunset.jpg"
      panelContent={
        <>
          <div className="flex justify-end">
            <p className="text-[10px] tracking-[0.4em] uppercase text-bronze/60">Gestão de obras</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display font-light text-bone/[0.06] text-[clamp(8rem,16vw,14rem)] leading-[0.8] select-none tracking-tight mb-10">OC</div>
            <blockquote className="font-display font-light text-bone/80 text-xl xl:text-2xl leading-relaxed italic max-w-sm">
              &ldquo;Canteiro e escritório em perfeita sincronia.&rdquo;
            </blockquote>
            <div className="w-12 h-px bg-bronze/40 mt-6" />
          </div>
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-bone/10">
            {[{ v: "40%", l: "Redução de custos*" }, { v: "15h", l: "Economia semanal*" }, { v: "99.9%", l: "Disponibilidade" }].map((s) => (
              <div key={s.l}><div className="font-display text-2xl text-bone/70 font-light">{s.v}</div><div className="text-[9px] tracking-[0.12em] uppercase text-bone/35 mt-1">{s.l}</div></div>
            ))}
          </div>
        </>
      }
    >
      <p className="auth-el text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
        <span className="inline-block w-10 h-px bg-bronze" />Área do cliente
      </p>
      <h1 ref={titleRef} className="font-display font-light text-bone text-4xl md:text-5xl leading-[1.05] mb-3 [&_.char]:inline-block overflow-hidden">
        Bem-vindo de volta.
      </h1>
      <p className="auth-el text-bone-dim mb-8 leading-relaxed">Acesse sua conta para gerenciar suas obras.</p>
      <div className="auth-el">
        <LoginForm nextPath={nextPath} />
      </div>
    </AuthShell>
  );
}
