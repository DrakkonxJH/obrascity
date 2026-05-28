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
    <main className="oc-public">
      <section
        className="oc-hero"
        style={{
          background:
            "radial-gradient(circle at 86% 16%, rgba(255, 107, 26, 0.18), transparent 46%), linear-gradient(160deg, #111726 0%, #0A0F1A 70%)",
          padding: "24px 22px",
          borderRadius: 18,
        }}
      >
        <div className="oc-kicker">Nossa história</div>
        <h1
          className="oc-title"
          style={{
            fontSize: "clamp(2.2rem,6vw,4rem)",
            lineHeight: ".92",
          }}
        >
          Construída por quem
          <br />
          vive a <span className="oc-title-accent">rotina da obra</span>
        </h1>
        <p className="oc-sub" style={{ fontSize: ".96rem", maxWidth: 700 }}>
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
              <div style={{ color: "#8F9DB9", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".11em" }}>
                {item.label}
              </div>
              <div style={{ marginTop: 4, color: "#E7EDF8", fontWeight: 700, fontSize: ".95rem" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="oc-grid-3">
        {pilares.map((item) => (
          <article key={item.title} className="oc-panel">
            <div style={{ fontSize: "1.5rem", marginBottom: 10 }}>{item.icon}</div>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "Barlow Condensed, sans-serif",
                textTransform: "uppercase",
                fontSize: "1.35rem",
                lineHeight: 1,
              }}
            >
              {item.title}
            </h2>
            <p style={{ margin: 0, color: "#A5B1CB", lineHeight: 1.55, fontSize: ".92rem" }}>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="oc-panel">
        <div className="oc-panel-kicker">Por que a ObrasCitY</div>
        <ul className="oc-list">
          {[
            "Operação 100% em nuvem com acesso de qualquer dispositivo.",
            "Isolamento por tenant e controles de segurança alinhados à LGPD.",
            "Arquitetura para rotina de obra: cronograma, financeiro, equipes e materiais no mesmo fluxo.",
            "Onboarding rápido com foco em resultado operacional desde a primeira semana.",
          ].map((item) => (
            <li key={item} className="oc-list-item">• {item}</li>
          ))}
        </ul>
      </section>

      <section className="oc-cta" style={{ background: "radial-gradient(circle at 20% 30%, rgba(255, 107, 26, 0.16), transparent 44%), linear-gradient(165deg, #121A2A, #0A0F18)" }}>
        <div
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            margin: "0 0 10px",
            textTransform: "uppercase",
            fontSize: "clamp(1.55rem, 3.2vw, 2.1rem)",
            lineHeight: ".95",
          }}
        >
          Pronto para tirar sua operação do improviso?
        </div>
        <p style={{ marginBottom: 16, color: "#B3BFD8", fontSize: ".94rem" }}>
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
