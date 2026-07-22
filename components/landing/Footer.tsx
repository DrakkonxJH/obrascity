"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Building2, Camera, ExternalLink, MessageCircle } from "lucide-react";
import { scrollStore } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const footerLinks = {
  PRODUTO: [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Resultados", href: "#resultados" },
    { label: "Módulos", href: "#modulos" },
    { label: "Planos e preços", href: "#planos" },
  ],
  EMPRESA: [
    { label: "Sobre nós", href: "#sobre" },
    { label: "Contato", href: "#contato" },
  ],
  SUPORTE: [
    { label: "Perguntas frequentes", href: "#faq" },
    { label: "Política de privacidade", href: "/privacidade" },
    { label: "Termos de uso", href: "/termos" },
    { label: "Política de cookies", href: "/politica-de-cookies" },
  ],
  COMUNIDADE: [
    { label: "Instagram", href: "https://instagram.com/obrascity", icon: Camera },
    { label: "LinkedIn", href: "https://linkedin.com/company/obrascity", icon: ExternalLink },
    { label: "WhatsApp", href: "https://wa.me/5592985383026", icon: MessageCircle },
  ],
};

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const wordmark = wordmarkRef.current;
      if (wordmark) {
        const letters = wordmark.querySelectorAll("span");
        
        gsap.fromTo(
          letters,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.04,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      gsap.to(wordmarkRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const wordmark = "OBRASCITY";

  return (
    <footer
      ref={rootRef}
      className="relative bg-ink border-t border-bone/10 overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#c9a96e 1px, transparent 1px), linear-gradient(90deg, #c9a96e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 pt-20 pb-14">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 md:gap-8 mb-16">
          
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <a href="#" className="flex items-baseline gap-1.5 mb-6 group w-fit">
              <Building2 className="w-6 h-6 text-bronze" />
              <span className="font-display text-lg tracking-tight text-bone">
                Obras<span className="text-bronze">City</span>
              </span>
            </a>
            <p className="text-[11px] tracking-[0.2em] uppercase text-bone/50 leading-relaxed mb-4">
              Plataforma de gestão de obras que sincroniza canteiro e escritório em tempo real.
            </p>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-bone/30">
              <span>São Paulo — Brasil</span>
              <span>·</span>
              <span>{time} BRT</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-bronze mb-5 font-semibold">
              Produto
            </h4>
            <ul className="space-y-3">
              {footerLinks.PRODUTO.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[12px] text-bone/60 hover:text-bronze transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-bronze mb-5 font-semibold">
              Empresa
            </h4>
            <ul className="space-y-3">
              {footerLinks.EMPRESA.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[12px] text-bone/60 hover:text-bronze transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-bronze mb-5 font-semibold">
              Suporte
            </h4>
            <ul className="space-y-3">
              {footerLinks.SUPORTE.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[12px] text-bone/60 hover:text-bronze transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community links */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-bronze mb-5 font-semibold">
              Comunidade
            </h4>
            <ul className="space-y-3">
              {footerLinks.COMUNIDADE.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-bone/60 hover:text-bronze transition-colors duration-300 flex items-center gap-2"
                  >
                    {item.icon && <item.icon className="w-3.5 h-3.5" />}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-bone/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-bone/30">
            © 2026 AtlasTech · Todos os direitos reservados
          </p>
          
          <button
            onClick={() =>
              scrollStore.lenis
                ? scrollStore.lenis.scrollTo(0)
                : window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="group w-10 h-10 rounded-full border border-bone/15 grid place-items-center text-bone/40 hover:border-bronze hover:text-bronze transition-all duration-300"
            aria-label="Voltar ao topo"
          >
            <svg
              className="transition-transform duration-500 group-hover:-translate-y-1"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 19V5m-6 6 6-6 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Monumental wordmark */}
      <div className="relative select-none pointer-events-none px-2 -mb-8 md:-mb-14 overflow-hidden">
        <div
          ref={wordmarkRef}
          className="font-display font-light text-stroke text-center leading-[0.82] text-[clamp(5rem,18vw,19rem)] tracking-tight whitespace-nowrap flex justify-center"
        >
          {wordmark.split("").map((letter, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <span className="inline-block">{letter}</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}