import Link from "next/link";

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
    <main className="of-page">
      <section className="of-card" style={{ marginBottom: 20 }}>
        <div className="of-card-title" style={{ marginBottom: 10 }}>
          Como funciona o ObrasFlow
        </div>
        <h1 className="of-page-title" style={{ marginBottom: 10 }}>
          Uma apresentação rápida de como a plataforma organiza a obra do início ao fim.
        </h1>
        <p className="of-empty-text" style={{ maxWidth: 900 }}>
          A ideia é simples: centralizar dados da obra, reduzir retrabalho e dar uma visão clara para engenharia,
          operação e diretoria.
        </p>
      </section>

      <div className="of-dashboard-grid" style={{ marginBottom: 20 }}>
        {etapas.map((etapa) => (
          <article key={etapa.titulo} className="of-card">
            <div className="of-card-title">{etapa.titulo}</div>
            <p className="of-list-description" style={{ marginBottom: 12 }}>
              {etapa.resumo}
            </p>
            <ul className="of-list">
              {etapa.itens.map((item) => (
                <li key={item} className="of-list-item">
                  <p className="of-list-description">• {item}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="of-card" style={{ marginBottom: 20 }}>
        <div className="of-card-title" style={{ marginBottom: 12 }}>
          O que você vê na prática
        </div>
        <div className="of-dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {modulos.map((modulo) => (
            <div
              key={modulo}
              style={{
                border: "1px solid var(--of-border)",
                borderRadius: 10,
                padding: 12,
                background: "var(--of-bg-3)",
              }}
            >
              <p className="of-list-description" style={{ margin: 0, fontWeight: 600 }}>
                {modulo}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="of-card">
        <div className="of-card-title" style={{ marginBottom: 12 }}>
          Próximo passo
        </div>
        <p className="of-list-description" style={{ marginBottom: 16 }}>
          Se quiser começar agora, crie sua conta e teste a experiência completa do sistema.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-flex" }}>
            Começar grátis
          </Link>
          <Link href="/login" className="of-btn-ghost" style={{ display: "inline-flex" }}>
            Entrar
          </Link>
          <Link href="/" className="of-btn-ghost" style={{ display: "inline-flex" }}>
            Voltar para a landing
          </Link>
        </div>
      </section>
    </main>
  );
}
