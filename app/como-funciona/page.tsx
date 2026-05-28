import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Como funciona — ObrasCitY",
  description:
    "Entenda como o ObrasCitY organiza a operação da obra do planejamento à entrega com visão executiva em tempo real.",
};

const etapas = [
  {
    titulo: "1. Entrar no sistema",
    resumo: "O time acessa com login corporativo e cai direto no painel principal.",
    itens: ["Visão de obras ativas", "Alertas de atraso", "Resumo financeiro e operacional"],
  },
  {
    titulo: "2. Organizar a operação",
    resumo: "Cadastre obras, equipes, materiais e cronograma para manter tudo sincronizado.",
    itens: ["Obras por fase", "Equipe por frente", "Materiais críticos e reposição"],
  },
  {
    titulo: "3. Acompanhar e decidir",
    resumo: "Use dashboards, relatórios e qualidade para agir antes que o problema cresça.",
    itens: ["Indicadores em tempo real", "Relatórios para diretoria e cliente", "Qualidade e não conformidades"],
  },
];

const modulos = [
  "Dashboard executivo",
  "Obras com histórico e progresso",
  "Cronograma Gantt com dependências",
  "Financeiro com orçamento vs. realizado",
  "Equipes e permissões",
  "Materiais com alertas de estoque",
  "Relatórios gerenciais",
  "Qualidade e tratativas",
];

export default function ComoFuncionaPage() {
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
            "radial-gradient(circle at 12% 10%, rgba(255,107,26,.2), transparent 40%), linear-gradient(160deg, #111726 0%, #0A0F1A 70%)",
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
          Sistema de gestão de obras
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
          Como o <span style={{ color: "#FF7B21" }}>ObrasCitY</span>
          <br />
          organiza sua obra
        </h1>
        <p style={{ color: "#A8B4CD", maxWidth: 780, marginTop: 16, fontSize: "1.02rem", lineHeight: 1.6 }}>
          Do planejamento à entrega, a plataforma integra cronograma, equipes, materiais, financeiro e qualidade em
          um fluxo único de execução com rastreabilidade.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex", padding: "10px 16px" }}>
            Começar 14 dias grátis
          </Link>
          <Link href="/contato" className="of-btn-ghost" style={{ display: "inline-flex", padding: "10px 16px" }}>
            Agendar demonstração
          </Link>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
        }}
      >
        {[
          { label: "Obras ativas", value: "8+" },
          { label: "No prazo", value: "98%" },
          { label: "Economia média", value: "R$280k" },
          { label: "Horas poupadas", value: "12h/sem" },
        ].map((item) => (
          <article
            key={item.label}
            style={{
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 14,
              background: "linear-gradient(180deg, rgba(16,23,37,.92), rgba(10,14,24,.92))",
              padding: "14px 16px",
            }}
          >
            <div style={{ color: "#8F9DB9", fontSize: ".76rem", textTransform: "uppercase", letterSpacing: ".06em" }}>
              {item.label}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: "2rem",
                lineHeight: 1,
                color: "#F1F4FF",
              }}
            >
              {item.value}
            </div>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 14,
        }}
      >
        {etapas.map((etapa) => (
          <article
            key={etapa.titulo}
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
              {etapa.titulo}
            </div>
            <p style={{ marginBottom: 12, color: "#A5B1CB", lineHeight: 1.55 }}>
              {etapa.resumo}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 9 }}>
              {etapa.itens.map((item) => (
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
        <div className="of-card-title" style={{ marginBottom: 12, color: "#FF9A57" }}>
          O que você vê na prática
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {modulos.map((modulo) => (
            <div
              key={modulo}
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12,
                padding: 12,
                background: "linear-gradient(180deg, rgba(21,29,45,.8), rgba(14,20,31,.8))",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, color: "#D5DEEF" }}>
                {modulo}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.11)",
          borderRadius: 18,
          padding: "22px 18px",
          background:
            "radial-gradient(circle at 82% 30%, rgba(255,107,26,.16), transparent 44%), linear-gradient(165deg, #121A2A, #0A0F18)",
        }}
      >
        <div className="of-card-title" style={{ marginBottom: 12, color: "#FF9A57" }}>
          Próximo passo da operação
        </div>
        <p style={{ marginBottom: 16, color: "#B3BFD8" }}>
          Se quiser ver esse fluxo rodando na sua obra, ative um trial e valide com seu time em ambiente real.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex" }}>
            Começar grátis agora
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
