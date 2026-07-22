"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import SplitType from "split-type";
import AuthShell from "@/components/auth/AuthShell";
import AuthInput from "@/components/auth/AuthInput";
import MagneticButton from "@/components/ui/MagneticButton";

export default function RecuperarClient() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!titleRef.current) return;
    const split = new SplitType(titleRef.current, { types: "chars", tagName: "span" });
    gsap.fromTo(split.chars, { yPercent: 120, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.025, ease: "power4.out", delay: 0.4,
    });
    gsap.fromTo(".auth-field, .auth-el", { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", delay: 0.7,
    });
    return () => split.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <AuthShell
      panelImage="/images/arch-texture.jpg"
      panelContent={
        <>
          <div className="flex justify-end">
            <p className="text-[10px] tracking-[0.4em] uppercase text-bronze/60">Recuperar acesso</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display font-light text-bone/[0.06] text-[clamp(8rem,16vw,14rem)] leading-[0.8] select-none tracking-tight mb-10">
              OC
            </div>
            <blockquote className="font-display font-light text-bone/80 text-xl xl:text-2xl leading-relaxed italic max-w-sm">
              &ldquo;Segurança e controle em cada etapa.&rdquo;
            </blockquote>
            <div className="w-12 h-px bg-bronze/40 mt-6" />
          </div>
          <div className="pt-8 border-t border-bone/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-bone/35">
              Seus dados estão protegidos com criptografia de ponta a ponta.
            </p>
          </div>
        </>
      }
    >
      <p className="auth-el text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
        <span className="inline-block w-10 h-px bg-bronze" />
        Recuperar acesso
      </p>

      <h1
        ref={titleRef}
        className="font-display font-light text-bone text-4xl md:text-5xl leading-[1.05] mb-3 [&_.char]:inline-block overflow-hidden"
      >
        {sent ? "E-mail enviado." : "Esqueceu a senha?"}
      </h1>

      {sent ? (
        <div className="auth-el mt-6">
          <p className="text-bone-dim mb-8 leading-relaxed">
            Se o e-mail <span className="text-bone font-medium">{email}</span> estiver
            cadastrado, você receberá instruções para redefinir sua senha.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-bronze hover:text-bronze/80 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar para login
          </Link>
        </div>
      ) : (
        <>
          <p className="auth-el text-bone-dim mb-10 leading-relaxed">
            Digite seu e-mail e enviaremos instruções para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthInput
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              required
            />

            <MagneticButton className="auth-el w-full bg-bone text-ink rounded-xl px-8 py-4">
              <span className="relative text-[13px] tracking-[0.15em] uppercase font-medium">
                Enviar instruções
              </span>
            </MagneticButton>
          </form>

          <p className="auth-el text-center text-bone-dim mt-8">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-bronze hover:text-bronze/80 transition-colors font-medium">
              Fazer login
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
