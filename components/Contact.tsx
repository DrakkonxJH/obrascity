"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import FloatingShapes from "./FloatingShapes";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Split title
      if (titleRef.current) {
        const split = new SplitType(titleRef.current, {
          types: "words,chars",
          tagName: "span",
        });

        gsap.fromTo(
          split.chars,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.02,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 65%",
              once: true,
            },
          }
        );
      }

      // Form fields stagger
      gsap.fromTo(
        ".form-field",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 60%",
            once: true,
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "site-v3" }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setForm({ name: "", email: "", company: "", phone: "" });
    } catch {
      setState("error");
    }
  };

  return (
    <section
      ref={rootRef}
      id="contato"
      className="relative bg-ink overflow-hidden"
    >
      <FloatingShapes variant="dark" density="sparse" />

      {/* Gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-bronze/5 blur-[180px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-32 md:py-44 grid lg:grid-cols-2 gap-20 lg:gap-28">
        <div>
          <p className="text-[11px] tracking-[0.4em] uppercase text-bronze mb-8 flex items-center gap-4">
            <span className="inline-block w-10 h-px bg-bronze" />
            Comece agora
          </p>
          <h2
            ref={titleRef}
            className="font-display font-light text-bone leading-[1] text-[clamp(2.6rem,6.5vw,5.8rem)] [&_.word]:inline-block [&_.word]:mr-[0.2em] [&_.char]:inline-block overflow-hidden"
          >
            Vamos construir juntos.
          </h2>
          <p className="mt-10 text-bone-dim max-w-sm leading-relaxed text-lg">
            Uma demonstração de 20 minutos. Sem compromisso — com a sua obra no
            centro da conversa.
          </p>

          <div className="mt-16 space-y-4">
            <a
              href="mailto:contato@obrascity.com.br"
              className="flex items-center gap-4 text-bone-dim hover:text-bronze transition-colors duration-300 group"
            >
              <span className="w-10 h-10 rounded-full border border-bone/20 grid place-items-center group-hover:border-bronze/50 transition-colors duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-sm tracking-wide">
                contato@obrascity.com.br
              </span>
            </a>
            <a
              href="tel:+551140028922"
              className="flex items-center gap-4 text-bone-dim hover:text-bronze transition-colors duration-300 group"
            >
              <span className="w-10 h-10 rounded-full border border-bone/20 grid place-items-center group-hover:border-bronze/50 transition-colors duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-sm tracking-wide">+55 11 4002-8922</span>
            </a>
          </div>
        </div>

        <div className="lg:pt-8">
          {state === "done" ? (
            <div className="border border-bronze/30 p-12 md:p-16 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-bronze mx-auto mb-6 grid place-items-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="#c9a96e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-display serif-i text-bronze text-3xl block mb-4">
                Recebido.
              </span>
              <p className="text-bone-dim leading-relaxed">
                Nossa equipe retorna em até 24 horas úteis para agendar a sua
                demonstração.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-8">
              {[
                { key: "name", label: "Nome", type: "text", placeholder: "Como devemos te chamar", required: true },
                { key: "email", label: "E-mail corporativo", type: "email", placeholder: "voce@construtora.com.br", required: true },
                { key: "company", label: "Empresa", type: "text", placeholder: "Nome da construtora", required: false },
                { key: "phone", label: "WhatsApp", type: "tel", placeholder: "(11) 98888-0000", required: false },
              ].map((field) => (
                <div key={field.key} className="form-field relative">
                  <label
                    className={`absolute left-0 transition-all duration-300 pointer-events-none ${
                      focusedField === field.key || form[field.key as keyof typeof form]
                        ? "text-[10px] tracking-[0.35em] uppercase text-bronze -top-5"
                        : "text-bone-dim text-sm top-3"
                    }`}
                  >
                    {field.label}
                    {!field.required && (
                      <span className="text-bone-dim/50 ml-2 normal-case tracking-normal">
                        (opcional)
                      </span>
                    )}
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={form[field.key as keyof typeof form]}
                    onFocus={() => setFocusedField(field.key)}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) =>
                      setForm({ ...form, [field.key]: e.target.value })
                    }
                    className="field pt-3"
                  />
                </div>
              ))}

              {state === "error" && (
                <p className="text-sm text-red-300/90 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded">
                  Algo falhou. Tente novamente em instantes.
                </p>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="form-field group relative w-full inline-flex items-center justify-center gap-4 bg-bone text-ink rounded-full px-10 py-5 overflow-hidden disabled:opacity-60 mt-4"
              >
                <span className="absolute inset-0 bg-bronze translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out rounded-full" />
                <span className="relative text-[13px] tracking-[0.18em] uppercase font-medium">
                  {state === "loading" ? "Enviando…" : "Agendar demonstração"}
                </span>
                <svg
                  className="relative transition-transform duration-500 group-hover:translate-x-2"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
