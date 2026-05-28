import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Como funciona — ObrasCitY",
  description:
    "Veja como o ObrasCitY centraliza cronograma, equipes, materiais, financeiro e qualidade para operar obras com previsibilidade.",
};

const etapas = [
  {
    titulo: "1. Entrar no sistema",
    resumo: "Login corporativo com visão imediata da operação em andamento.",
    itens: ["Obras ativas", "Alertas de atraso", "Resumo financeiro"],
  },
  {
    titulo: "2. Organizar a operação",
    resumo: "Cadastro de obras, frentes, equipes, materiais e cronograma no mesmo fluxo.",
    itens: ["Frentes por fase", "Materiais críticos", "Aprovações operacionais"],
  },
  {
    titulo: "3. Acompanhar e decidir",
    resumo: "Indicadores e relatórios para antecipar risco e corrigir rota com rapidez.",
    itens: ["KPIs em tempo real", "Relatórios executivos", "Qualidade e tratativas"],
  },
];

export default function ComoFuncionaPage() {
  return (
    <main style={{ background: "#030714", minHeight: "100vh", color: "#F0F4FF" }}>
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 86% 22%, rgba(255,107,26,.16), transparent 45%), linear-gradient(180deg, rgba(4,9,24,.95), rgba(2,7,20,.98))",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 0.35,
          }}
        />

        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "18px 20px 36px" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 42 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#ff8a2d,#ff6200)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 24px rgba(255,107,26,.4)",
                }}
              >
                🏗
              </div>
              <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "1.8rem", fontWeight: 700 }}>
                OBRAS<span style={{ color: "#FF6B1A" }}>CITY</span>
              </div>
            </Link>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/login" className="of-btn-ghost" style={{ display: "inline-flex", alignItems: "center" }}>
                Entrar
              </Link>
              <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex", alignItems: "center" }}>
                Começar grátis →
              </Link>
            </div>
          </nav>

          <div
            style={{
              border: "1px solid rgba(255,255,255,.11)",
              borderRadius: 22,
              padding: "30px 26px",
              background:
                "radial-gradient(circle at 8% 8%, rgba(255,107,26,.18), transparent 40%), linear-gradient(160deg, rgba(16,22,37,.95), rgba(6,11,22,.95))",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 20,
            }}
          >
            <div>
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
                Software de gestão de obras
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "clamp(2.8rem,8vw,5.5rem)",
                  lineHeight: ".9",
                  textTransform: "uppercase",
                }}
              >
                Como o <span style={{ color: "#FF6B1A" }}>ObrasCitY</span>
                <br />
                organiza sua obra
              </h1>
              <p style={{ marginTop: 18, color: "#A9B5CD", fontSize: "1.05rem", maxWidth: 620, lineHeight: 1.6 }}>
                Do planejamento à entrega, a plataforma integra cronograma, equipes, materiais, financeiro e
                qualidade em um fluxo único de execução com rastreabilidade.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex" }}>
                  Começar 14 dias grátis
                </Link>
                <Link href="/contato" className="of-btn-ghost" style={{ display: "inline-flex" }}>
                  Agendar demonstração
                </Link>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 16,
                background: "rgba(14,20,33,.82)",
                padding: 14,
                alignSelf: "end",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: "#ff4060", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: 99, background: "#ffd166", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: 99, background: "#1fd07a", display: "inline-block" }} />
                <span style={{ marginLeft: "auto", color: "#7F91B3", fontSize: ".75rem", fontFamily: "JetBrains Mono, monospace" }}>
                  ObrasCitY · Fluxo
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["Obras ativas", "8"],
                  ["No prazo", "98%"],
                  ["Orçamento", "R$12,4M"],
                  ["Profissionais", "24"],
                ].map(([k, v]) => (
                  <div key={k} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 10px" }}>
                    <div style={{ color: "#7F91B3", fontSize: ".69rem", textTransform: "uppercase", letterSpacing: ".08em" }}>{k}</div>
                    <div style={{ marginTop: 3, fontFamily: "Barlow Condensed, sans-serif", fontSize: "1.9rem", lineHeight: 1 }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "4px 20px 44px", display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {etapas.map((etapa) => (
            <article
              key={etapa.titulo}
              style={{
                border: "1px solid rgba(255,255,255,.11)",
                borderRadius: 16,
                padding: "18px 16px",
                background: "rgba(9,14,25,.95)",
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
                {etapa.titulo}
              </div>
              <p style={{ color: "#A8B4CD", lineHeight: 1.55 }}>{etapa.resumo}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {etapa.itens.map((item) => (
                  <li
                    key={item}
                    style={{
                      border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      color: "#C7D2E9",
                      background: "rgba(19,26,40,.55)",
                    }}
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
