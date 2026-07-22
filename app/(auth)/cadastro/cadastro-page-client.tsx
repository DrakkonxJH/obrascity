"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import SplitType from "split-type";
import AuthShell from "@/components/landing/AuthShell";
import { SignupForm } from "./signup-form";

export default function CadastroPageClient() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    const split = new SplitType(titleRef.current, { types: "chars", tagName: "span" });
    gsap.fromTo(split.chars, { yPercent: 120, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.025, ease: "power4.out", delay: 0.4,
    });
    gsap.fromTo(".auth-el", { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", delay: 0.6,
    });
    return () => split.revert();
  }, []);

  return (
    <AuthShell
      panelImage="/images/work-interior.jpg"
      panelContent={
        <>
          <div className="flex justify-end"><p className="text-[10px] tracking-[0.4em] uppercase text-bronze/60">Criar conta</p></div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-bronze/50 mb-10">Por que a ObrasCity?</p>
            <div className="space-y-7">
              {[
                { title: "Tempo real", desc: "Atualizações instantâneas.", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2" },
                { title: "Gestão unificada", desc: "Finanças, suprimentos, cronograma.", icon: "M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M21 7H3M12 11v10" },
                { title: "Equipe conectada", desc: "Campo e escritório sincronizados.", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87" },
              ].map((f) => (
                <div key={f.title} className="flex gap-5 group">
                  <div className="w-11 h-11 rounded-lg border border-bronze/20 flex items-center justify-center text-bronze shrink-0 group-hover:bg-bronze/10 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={f.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></div>
                  <div><h3 className="font-display text-bone/85 text-base mb-0.5">{f.title}</h3><p className="text-bone-dim/60 text-sm">{f.desc}</p></div>
                </div>
              ))}
            </div>
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
        <span className="inline-block w-10 h-px bg-bronze" />Criar conta
      </p>
      <h1 ref={titleRef} className="font-display font-light text-bone text-4xl md:text-5xl leading-[1.05] mb-3 [&_.char]:inline-block overflow-hidden">
        Comece agora.
      </h1>
      <p className="auth-el text-bone-dim mb-8">Cadastro rápido. 14 dias grátis.</p>
      <div className="auth-el [&_form]:space-y-4 [&_input]:!w-full [&_input]:!bg-white/[0.04] [&_input]:!border [&_input]:!border-white/10 [&_input]:!rounded-xl [&_input]:!px-5 [&_input]:!py-3.5 [&_input]:!text-bone [&_input:focus]:!border-bronze [&_input:focus]:!outline-none [&_select]:!w-full [&_select]:!bg-white/[0.04] [&_select]:!border [&_select]:!border-white/10 [&_select]:!rounded-xl [&_select]:!px-5 [&_select]:!py-3.5 [&_select]:!text-bone [&_label]:!block [&_label]:!text-[10px] [&_label]:!tracking-[0.3em] [&_label]:!uppercase [&_label]:!text-bone-dim [&_label]:!mb-1.5 [&_button[type=submit]]:!w-full [&_button[type=submit]]:!bg-bone [&_button[type=submit]]:!text-ink [&_button[type=submit]]:!rounded-xl [&_button[type=submit]]:!px-8 [&_button[type=submit]]:!py-4 [&_button[type=submit]]:!font-medium [&_button[type=submit]]:!text-[13px] [&_button[type=submit]]:!tracking-[0.12em] [&_button[type=submit]]:!uppercase [&_button[type=submit]]:hover:!bg-bronze [&_button[type=submit]]:!transition-colors [&_button[type=submit]]:!border-0 [&_a]:text-bronze [&_a]:hover:text-bronze/80">
        <SignupForm />
        <p className="mt-6 text-center text-sm text-bone-dim">
          Já tem conta?{" "}
          <Link href="/login" className="text-bronze hover:text-bronze/80 font-medium">Fazer login</Link>
        </p>
      </div>
    </AuthShell>
  );
}
