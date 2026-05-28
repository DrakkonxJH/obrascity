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
    <main className="oc-public">
      <section className="oc-hero">
        <div className="oc-kicker">Sistema de gestão de obras</div>
        <h1 className="oc-title">
          Como o <span className="oc-title-accent">ObrasCitY</span>
          <br />
          organiza sua obra
        </h1>
        <p className="oc-sub">
          Do planejamento à entrega, a plataforma integra cronograma, equipes, materiais, financeiro e qualidade em
          um fluxo único de execução com rastreabilidade.
        </p>
        <div className="oc-actions">
          <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex", padding: "10px 16px" }}>
            Começar 14 dias grátis
          </Link>
          <Link href="/contato" className="of-btn-ghost" style={{ display: "inline-flex", padding: "10px 16px" }}>
            Agendar demonstração
          </Link>
        </div>
      </section>

      <section className="oc-grid-4">
        {[
          { label: "Obras ativas", value: "8+" },
          { label: "No prazo", value: "98%" },
          { label: "Economia média", value: "R$280k" },
          { label: "Horas poupadas", value: "12h/sem" },
        ].map((item) => (
          <article key={item.label} className="oc-stat">
            <div className="oc-stat-label">{item.label}</div>
            <div className="oc-stat-value">{item.value}</div>
          </article>
        ))}
      </section>

      <section className="oc-grid-3">
        {etapas.map((etapa) => (
          <article key={etapa.titulo} className="oc-panel">
            <div className="oc-panel-kicker">{etapa.titulo}</div>
            <p className="oc-copy" style={{ marginBottom: 12 }}>{etapa.resumo}</p>
            <ul className="oc-list">
              {etapa.itens.map((item) => (
                <li key={item} className="oc-list-item">• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="oc-panel">
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

      <section className="oc-cta">
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
