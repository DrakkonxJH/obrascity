"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import AuthShell from "@/components/landing/AuthShell";
import { RecoveryForm } from "./recovery-form";

export default function RecuperarPageClient() {
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
      panelImage="/images/arch-texture.jpg"
      panelContent={
        <>
          <div className="flex justify-end"><p className="text-[10px] tracking-[0.4em] uppercase text-bronze/60">Recuperar acesso</p></div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display font-light text-bone/[0.06] text-[clamp(8rem,16vw,14rem)] leading-[0.8] select-none tracking-tight mb-10">OC</div>
            <blockquote className="font-display font-light text-bone/80 text-xl leading-relaxed italic max-w-sm">&ldquo;Segurança e controle em cada etapa.&rdquo;</blockquote>
            <div className="w-12 h-px bg-bronze/40 mt-6" />
          </div>
          <div className="pt-8 border-t border-bone/10"><p className="text-[10px] tracking-[0.2em] uppercase text-bone/35">Dados protegidos com criptografia de ponta a ponta.</p></div>
        </>
      }
    >
      <p className="auth-el text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
        <span className="inline-block w-10 h-px bg-bronze" />Recuperar acesso
      </p>
      <h1 ref={titleRef} className="font-display font-light text-bone text-4xl md:text-5xl leading-[1.05] mb-3 [&_.char]:inline-block overflow-hidden">
        Esqueceu a senha?
      </h1>
      <p className="auth-el text-bone-dim mb-8">Enviaremos instruções para redefinir sua senha.</p>
      <div className="auth-el [&_form]:space-y-4 [&_input]:!w-full [&_input]:!bg-white/[0.04] [&_input]:!border [&_input]:!border-white/10 [&_input]:!rounded-xl [&_input]:!px-5 [&_input]:!py-3.5 [&_input]:!text-bone [&_input:focus]:!border-bronze [&_input:focus]:!outline-none [&_label]:!block [&_label]:!text-[10px] [&_label]:!tracking-[0.3em] [&_label]:!uppercase [&_label]:!text-bone-dim [&_label]:!mb-1.5 [&_button[type=submit]]:!w-full [&_button[type=submit]]:!bg-bone [&_button[type=submit]]:!text-ink [&_button[type=submit]]:!rounded-xl [&_button[type=submit]]:!px-8 [&_button[type=submit]]:!py-4 [&_button[type=submit]]:!font-medium [&_button[type=submit]]:!text-[13px] [&_button[type=submit]]:!tracking-[0.12em] [&_button[type=submit]]:!uppercase [&_button[type=submit]]:hover:!bg-bronze [&_button[type=submit]]:!transition-colors [&_button[type=submit]]:!border-0 [&_a]:text-bronze [&_a]:hover:text-bronze/80">
        <RecoveryForm />
      </div>
    </AuthShell>
  );
}
