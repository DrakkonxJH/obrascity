"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import SplitType from "split-type";
import { signInAction } from "@/app/(auth)/login/actions";
import AuthShell from "@/components/auth/AuthShell";
import AuthInput from "@/components/auth/AuthInput";
import MagneticButton from "@/components/ui/MagneticButton";


export default function LoginClient() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("next", "/dashboard");

    try {
      const result = await signInAction({ ok: false, message: "" }, formData);
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
      }
      // If result.ok is true, the server action will handle the redirect
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      panelImage="/images/crane-sunset.jpg"
      panelContent={
        <>
          <div className="flex justify-end">
            <p className="text-[10px] tracking-[0.4em] uppercase text-bronze/60">Gestão de obras</p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* Giant monogram */}
            <div className="font-display font-light text-bone/[0.06] text-[clamp(8rem,16vw,14rem)] leading-[0.8] select-none tracking-tight mb-10">
              OC
            </div>

            <blockquote className="font-display font-light text-bone/80 text-xl xl:text-2xl leading-relaxed italic max-w-sm">
              &ldquo;Canteiro e escritório em perfeita sincronia.&rdquo;
            </blockquote>
            <div className="w-12 h-px bg-bronze/40 mt-6" />
            <p className="text-[10px] tracking-[0.25em] uppercase text-bone/40 mt-4">
              Plataforma ObrasCity · AtlasTech
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-bone/10">
            {[
              { v: "40%", l: "Redução de custos*" },
              { v: "15h", l: "Economia semanal*" },
              { v: "99.9%", l: "Disponibilidade" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl text-bone/70 font-light">{s.v}</div>
                <div className="text-[9px] tracking-[0.12em] uppercase text-bone/35 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </>
      }
    >
      <p className="auth-el text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
        <span className="inline-block w-10 h-px bg-bronze" />
        Área do cliente
      </p>

      <h1
        ref={titleRef}
        className="font-display font-light text-bone text-4xl md:text-5xl leading-[1.05] mb-3 [&_.char]:inline-block overflow-hidden"
      >
        Bem-vindo de volta.
      </h1>

      <p className="auth-el text-bone-dim mb-10 leading-relaxed">
        Acesse sua conta para gerenciar suas obras em tempo real.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="seu@email.com"
          required
        />

        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span /> {/* placeholder for layout */}
            <Link
              href="/recuperar-senha"
              className="text-[10px] tracking-[0.15em] uppercase text-bronze/60 hover:text-bronze transition-colors relative z-20"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <AuthInput
            label="Senha"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="auth-el text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <MagneticButton
          disabled={loading}
          className="auth-el w-full bg-bone text-ink rounded-xl px-8 py-4 mt-2"
        >
          <span className="relative text-[13px] tracking-[0.15em] uppercase font-medium">
            {loading ? "Entrando..." : "Entrar na plataforma"}
          </span>
          {!loading && (
            <svg className="relative transition-transform duration-300 group-hover:translate-x-1" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </MagneticButton>
      </form>

      <div className="auth-el flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-bone/10" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-bone-dim/50">ou</span>
        <div className="flex-1 h-px bg-bone/10" />
      </div>

      <p className="auth-el text-center text-bone-dim">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-bronze hover:text-bronze/80 transition-colors font-medium">
          Criar conta gratuita
        </Link>
      </p>
    </AuthShell>
  );
}
