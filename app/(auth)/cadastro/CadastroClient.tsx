"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import SplitType from "split-type";
import AuthShell from "@/components/auth/AuthShell";
import AuthInput from "@/components/auth/AuthInput";
import MagneticButton from "@/components/ui/MagneticButton";
import PasswordStrength from "@/components/auth/PasswordStrength";

export default function CadastroClient() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", role: "",
    password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!titleRef.current) return;
    const split = new SplitType(titleRef.current, { types: "chars", tagName: "span" });
    gsap.fromTo(split.chars, { yPercent: 120, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.025, ease: "power4.out", delay: 0.4,
    });
    gsap.fromTo(".auth-field, .auth-el", { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", delay: 0.6,
    });
    return () => split.revert();
  }, []);

  useEffect(() => {
    gsap.fromTo(".step-area", { opacity: 0, x: 30 }, {
      opacity: 1, x: 0, duration: 0.5, ease: "power3.out",
    });
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (form.password !== form.confirmPassword) { setError("As senhas não coincidem."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, company: form.company, role: form.role, source: "cadastro" }),
      });
      if (res.ok) setSuccess(true); else setError("Ocorreu um erro. Tente novamente.");
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  };

  const features = [
    { title: "Tempo real", desc: "Atualizações instantâneas do canteiro.", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2" },
    { title: "Gestão unificada", desc: "Finanças, suprimentos, cronograma.", icon: "M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M21 7H3M12 11v10" },
    { title: "Equipe conectada", desc: "Campo e escritório sincronizados.", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87" },
  ];

  return (
    <AuthShell
      panelImage="/images/work-interior.jpg"
      panelContent={
        <>
          <div className="flex justify-end">
            <p className="text-[10px] tracking-[0.4em] uppercase text-bronze/60">Criar conta</p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-bronze/50 mb-10">
              Por que a ObrasCity?
            </p>

            <div className="space-y-7">
              {features.map((f) => (
                <div key={f.title} className="flex gap-5 group">
                  <div className="w-11 h-11 rounded-lg border border-bronze/20 flex items-center justify-center text-bronze shrink-0 group-hover:bg-bronze/10 transition-colors duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d={f.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-bone/85 text-base mb-0.5">{f.title}</h3>
                    <p className="text-bone-dim/60 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div className="mt-14 p-5 border border-bone/8 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full border border-bronze/30 grid place-items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-bone/50">
                  Dados protegidos · Criptografia de ponta
                </span>
              </div>
              <p className="text-[11px] text-bone-dim/50 leading-relaxed">
                Seus dados são processados em servidores seguros com backup automático.
              </p>
            </div>
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
      {/* Progress */}
      <div className="auth-el mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-bone-dim">
            Passo {step} de 2
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-bronze">
            {step === 1 ? "Dados" : "Credenciais"}
          </span>
        </div>
        <div className="h-1 bg-bone/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-bronze rounded-full origin-left transition-transform duration-700 ease-out"
            style={{ transform: `scaleX(${step / 2})` }}
          />
        </div>
      </div>

      <p className="auth-el text-[11px] tracking-[0.4em] uppercase text-bronze mb-4 flex items-center gap-4">
        <span className="inline-block w-10 h-px bg-bronze" />
        Criar conta
      </p>

      <h1
        ref={titleRef}
        className="font-display font-light text-bone text-4xl md:text-5xl leading-[1.05] mb-3 [&_.char]:inline-block overflow-hidden"
      >
        {success ? "Tudo certo." : "Comece agora."}
      </h1>

      {success ? (
        <div className="step-area mt-6">
          <p className="text-bone-dim mb-8 leading-relaxed">
            Cadastro recebido! Entraremos em contato para liberar seu acesso.
          </p>
          <div className="p-6 border border-bronze/25 rounded-xl bg-bronze/[0.04] mb-8">
            <p className="text-sm text-bone-dim">
              <span className="text-bronze font-medium">Próximo passo:</span>{" "}
              Fique de olho no e-mail — enviaremos instruções de ativação.
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-bronze hover:text-bronze/80 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Voltar ao início
          </Link>
        </div>
      ) : (
        <>
          <p className="auth-el text-bone-dim mb-8">
            {step === 1 ? "Preencha seus dados para começar." : "Defina suas credenciais de acesso."}
          </p>

          <form onSubmit={handleSubmit} className="step-area space-y-4">
            {step === 1 ? (
              <>
                <AuthInput label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Seu nome" required />
                <AuthInput label="E-mail corporativo" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="seu@empresa.com.br" required />
                <div className="grid grid-cols-2 gap-3">
                  <AuthInput label="Telefone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(11) 99999-0000" optional />
                  <div className="auth-field">
                    <div className="relative">
                      <label className="absolute left-5 top-2 text-[9px] tracking-[0.3em] uppercase text-bronze pointer-events-none">Cargo</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 pt-6 pb-2.5 text-bone outline-none transition-all duration-300 hover:border-white/20 focus:border-bronze/40 focus:bg-white/[0.06]"
                      >
                        <option value="" className="bg-ink">Selecione</option>
                        <option value="engenheiro" className="bg-ink">Engenheiro(a)</option>
                        <option value="diretor" className="bg-ink">Diretor(a)</option>
                        <option value="gestor" className="bg-ink">Gestor(a)</option>
                        <option value="outro" className="bg-ink">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
                <AuthInput label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Nome da empresa" optional />
              </>
            ) : (
              <>
                <div>
                  <AuthInput label="Criar senha" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Mínimo 8 caracteres" required minLength={8} />
                  <PasswordStrength password={form.password} />
                </div>
                <AuthInput label="Confirmar senha" type="password" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} placeholder="Digite novamente" required />
                <label className="flex items-start gap-3 cursor-pointer group pt-3">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-bone/30 bg-white/5 text-bronze focus:ring-bronze" />
                  <span className="text-sm text-bone-dim/60 group-hover:text-bone-dim transition-colors">
                    Li e aceito os <Link href="#" className="text-bronze hover:underline">Termos de Uso</Link> e a <Link href="#" className="text-bronze hover:underline">Política de Privacidade</Link>
                  </span>
                </label>
              </>
            )}

            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</div>}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)}
                  className="px-5 py-4 border border-bone/12 text-bone-dim rounded-xl hover:border-bone/25 hover:text-bone transition-all text-[12px] tracking-[0.1em] uppercase">
                  Voltar
                </button>
              )}
              <MagneticButton disabled={loading} className="flex-1 bg-bone text-ink rounded-xl px-8 py-4">
                <span className="relative text-[13px] tracking-[0.15em] uppercase font-medium">
                  {loading ? "Criando..." : step === 1 ? "Continuar" : "Criar conta"}
                </span>
                {!loading && <svg className="relative transition-transform duration-300 group-hover:translate-x-1" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </MagneticButton>
            </div>
          </form>

          <p className="auth-el text-center text-bone-dim mt-8">
            Já tem conta?{" "}
            <Link href="/login" className="text-bronze hover:text-bronze/80 transition-colors font-medium">Fazer login</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
