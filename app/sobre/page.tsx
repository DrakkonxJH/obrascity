import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nós — ObrasCitY",
  description: "Conheça a história, missão e visão da ObrasCitY, a plataforma de gestão de obras para construtoras brasileiras.",
};

export default function SobrePage() {
  const pilares = [
    {
      title: "Missão",
      text: "Transformar a gestão de obras no Brasil com tecnologia prática, execução rastreável e decisões orientadas por dados.",
      icon: "🎯",
    },
    {
      title: "Visão",
      text: "Ser a plataforma operacional de referência para construtoras que buscam previsibilidade real de prazo, custo e qualidade.",
      icon: "🔭",
    },
    {
      title: "Valores",
      text: "Transparência operacional, compromisso técnico, evolução contínua e proximidade com a rotina de obra.",
      icon: "🤝",
    },
  ];

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "28px 20px 44px",
        display: "grid",
        gap: 18,
      }}
    >
      <section
        style={{
          border: "1px solid rgba(255,255,255,.11)",
          borderRadius: 20,
          padding: "30px 28px",
          background:
            "radial-gradient(circle at 86% 16%, rgba(255,107,26,.18), transparent 46%), linear-gradient(160deg, #111726 0%, #0A0F1A 70%)",
          boxShadow: "0 24px 60px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "#FF9A57",
            fontSize: ".72rem",
            marginBottom: 14,
          }}
        >
          Nossa história
        </div>
        <h1
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            margin: 0,
            fontSize: "clamp(2.5rem, 8vw, 5rem)",
            lineHeight: ".9",
            letterSpacing: ".01em",
            textTransform: "uppercase",
          }}
        >
          Construída por quem
          <br />
          vive a <span style={{ color: "#FF7B21" }}>rotina da obra</span>
        </h1>
        <p style={{ color: "#A8B4CD", maxWidth: 780, marginTop: 16, fontSize: "1.02rem", lineHeight: 1.6 }}>
          A ObrasCitY nasceu da fricção operacional real entre canteiro e escritório. Nossa meta é simples: tirar a
          operação do improviso e entregar previsibilidade de prazo, custo e execução para engenharia e diretoria.
        </p>
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 10,
            maxWidth: 760,
          }}
        >
          {[
            { label: "Foco", value: "Execução real" },
            { label: "Base", value: "Dados operacionais" },
            { label: "Resultado", value: "Decisão rápida" },
            { label: "Modelo", value: "SaaS escalável" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 12,
                padding: "10px 12px",
                background: "rgba(19,26,40,.6)",
              }}
            >
              <div style={{ color: "#8F9DB9", fontSize: ".74rem", textTransform: "uppercase", letterSpacing: ".07em" }}>
                {item.label}
              </div>
              <div style={{ marginTop: 4, color: "#E7EDF8", fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 14,
        }}
      >
        {pilares.map((item) => (
          <article
            key={item.title}
            style={{
              border: "1px solid rgba(255,255,255,.11)",
              borderRadius: 16,
              padding: "18px 16px",
              background: "rgba(11,16,27,.95)",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{item.icon}</div>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "Barlow Condensed, sans-serif",
                textTransform: "uppercase",
                fontSize: "1.6rem",
                lineHeight: 1,
              }}
            >
              {item.title}
            </h2>
            <p style={{ margin: 0, color: "#A5B1CB", lineHeight: 1.55 }}>{item.text}</p>
          </article>
        ))}
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.11)",
          borderRadius: 16,
          padding: "18px 16px",
          background: "rgba(11,16,27,.95)",
        }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: ".73rem",
            textTransform: "uppercase",
            letterSpacing: ".14em",
            color: "#FF8F43",
            marginBottom: 10,
          }}
        >
          Por que a ObrasCitY
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 9 }}>
          {[
            "Operação 100% em nuvem com acesso de qualquer dispositivo.",
            "Isolamento por tenant e controles de segurança alinhados à LGPD.",
            "Arquitetura para rotina de obra: cronograma, financeiro, equipes e materiais no mesmo fluxo.",
            "Onboarding rápido com foco em resultado operacional desde a primeira semana.",
          ].map((item) => (
            <li
              key={item}
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 10,
                padding: "10px 12px",
                background: "rgba(20,27,42,.55)",
                color: "#C6D1E8",
              }}
            >
              • {item}
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.11)",
          borderRadius: 18,
          padding: "22px 18px",
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,107,26,.16), transparent 44%), linear-gradient(165deg, #121A2A, #0A0F18)",
        }}
      >
        <div
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            margin: "0 0 10px",
            textTransform: "uppercase",
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            lineHeight: ".95",
          }}
        >
          Pronto para tirar sua operação do improviso?
        </div>
        <p style={{ marginBottom: 16, color: "#B3BFD8" }}>
          Ative o trial e valide com sua equipe em cenário real de obra.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex" }}>
            Começar grátis
          </Link>
          <Link href="/contato" className="of-btn-ghost" style={{ display: "inline-flex" }}>
            Falar com especialista
          </Link>
          <Link href="/" className="of-btn-ghost" style={{ display: "inline-flex" }}>
            Voltar para a landing
          </Link>
        </div>
      </section>
    </main>
  );
}
