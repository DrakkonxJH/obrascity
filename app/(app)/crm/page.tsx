type Deal = {
  nome: string;
  empresa: string;
  valor: string;
  responsavel: string;
  ultimaAtividade: string;
  prazo: string;
  prioridade: "baixa" | "media" | "alta";
  atividades: number;
  tags: string[];
};

type Stage = {
  etapa: string;
  color: string;
  total: string;
  deals: Deal[];
};

const crmTabs = ["Negocios", "Contatos", "Empresas", "Atividades", "Relatorios"];

const pipeline: Stage[] = [
  {
    etapa: "Novos",
    color: "#14d8ff",
    total: "R$ 127.930",
    deals: [
      {
        nome: "Residencial Aurora",
        empresa: "Aurora Construtora",
        valor: "R$ 180.000",
        responsavel: "Julio",
        ultimaAtividade: "Hoje, 09:40",
        prazo: "31/05/2026",
        prioridade: "media",
        atividades: 3,
        tags: ["Lead quente"],
      },
      {
        nome: "Galpao Metal Forte",
        empresa: "Metal Forte",
        valor: "R$ 95.000",
        responsavel: "Admin",
        ultimaAtividade: "Ontem, 17:15",
        prazo: "29/05/2026",
        prioridade: "alta",
        atividades: 5,
        tags: ["Industrial"],
      },
    ],
  },
  {
    etapa: "Qualificacao",
    color: "#00b9ff",
    total: "R$ 119.870",
    deals: [
      {
        nome: "Clinica Nova Vida",
        empresa: "Nova Vida",
        valor: "R$ 210.000",
        responsavel: "Julio",
        ultimaAtividade: "Hoje, 11:20",
        prazo: "05/06/2026",
        prioridade: "media",
        atividades: 2,
        tags: ["Comercial"],
      },
    ],
  },
  {
    etapa: "Proposta",
    color: "#2d7dff",
    total: "R$ 962.060",
    deals: [
      {
        nome: "Complexo Jardim Sul",
        empresa: "Jardim Sul SPE",
        valor: "R$ 760.000",
        responsavel: "Admin",
        ultimaAtividade: "Hoje, 08:30",
        prazo: "02/06/2026",
        prioridade: "alta",
        atividades: 6,
        tags: ["Multiobra", "Premium"],
      },
      {
        nome: "Reforma Atlas",
        empresa: "Atlas Engenharia",
        valor: "R$ 62.000",
        responsavel: "Julio",
        ultimaAtividade: "Ontem, 15:00",
        prazo: "30/05/2026",
        prioridade: "baixa",
        atividades: 1,
        tags: ["Reforma"],
      },
    ],
  },
  {
    etapa: "Negociacao",
    color: "#ffae00",
    total: "R$ 843.010",
    deals: [
      {
        nome: "Condominio Vale Norte",
        empresa: "Vale Norte",
        valor: "R$ 420.000",
        responsavel: "Julio",
        ultimaAtividade: "Hoje, 10:10",
        prazo: "28/05/2026",
        prioridade: "alta",
        atividades: 4,
        tags: ["Assinatura pendente"],
      },
    ],
  },
  {
    etapa: "Fechado ganho",
    color: "#79d70f",
    total: "R$ 677.026",
    deals: [
      {
        nome: "Obra Escola Centro",
        empresa: "Prefeitura Centro",
        valor: "R$ 340.000",
        responsavel: "Admin",
        ultimaAtividade: "22/05/2026",
        prazo: "Concluido",
        prioridade: "baixa",
        atividades: 0,
        tags: ["Contrato assinado"],
      },
    ],
  },
];

const fontesImportacao = [
  {
    nome: "Trello",
    status: "API disponivel",
    detalhe: "Importacao de boards, listas e cards via chave/token.",
  },
  {
    nome: "Jira",
    status: "API disponivel",
    detalhe: "Importacao de projetos, issues e status por REST API.",
  },
  {
    nome: "HubSpot",
    status: "API disponivel",
    detalhe: "Importacao de contatos, empresas e negocios com OAuth.",
  },
  {
    nome: "Pipedrive",
    status: "API disponivel",
    detalhe: "Importacao de leads e funil comercial por API.",
  },
  {
    nome: "CSV/Excel",
    status: "Pronto para MVP",
    detalhe: "Upload de base de clientes e oportunidades com mapeamento de colunas.",
  },
];

function prioridadeCor(prioridade: Deal["prioridade"]) {
  if (prioridade === "alta") return "var(--of-red)";
  if (prioridade === "media") return "var(--of-yellow)";
  return "var(--of-blue)";
}

export default function CrmPage() {
  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 16, alignItems: "center" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            CRM de Obras
          </h1>
          <p className="of-empty-text">
            Visao operacional de negocios com pipeline, atividades e controle de conversao.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="of-btn-primary" type="button">+ Novo negocio</button>
          <button className="of-btn-ghost" type="button">Regras de automacao</button>
        </div>
      </div>

      <article className="of-card" style={{ marginBottom: 16, padding: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {crmTabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={index === 0 ? "of-btn-primary" : "of-btn-ghost"}
              style={{ minHeight: 36 }}
            >
              {tab}
            </button>
          ))}
        </div>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr auto", alignItems: "center" }}>
          <input className="of-input" placeholder="Buscar negocios, clientes ou responsavel..." />
          <select className="of-input" defaultValue="em-andamento">
            <option value="em-andamento">Em andamento</option>
            <option value="todos">Todos</option>
            <option value="parados">Sem atividade</option>
          </select>
          <select className="of-input" defaultValue="kanban">
            <option value="kanban">Visao Kanban</option>
            <option value="lista">Visao Lista</option>
            <option value="calendario">Visao Calendario</option>
          </select>
          <button className="of-btn-ghost" type="button">Filtros avancados</button>
        </div>
      </article>

      <div className="of-kpi-grid" style={{ marginBottom: 16 }}>
        <article className="of-metric-card blue">
          <p className="of-kpi-label">Negocios ativos</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>18</p>
          <p className="of-metric-change">6 sem atividade hoje</p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">Valor total do funil</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>R$ 2,73 mi</p>
          <p className="of-metric-change">janela de 30 dias</p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-label">Conversao</p>
          <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>32%</p>
          <p className="of-metric-change">meta: 35%</p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-label">Follow-ups pendentes</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>9</p>
          <p className="of-metric-change">3 vencidos</p>
        </article>
      </div>

      <article className="of-card">
        <div className="of-card-title" style={{ marginBottom: 10 }}>
          Pipeline comercial (kanban horizontal)
        </div>
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(280px, 1fr)",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 6,
          }}
        >
          {pipeline.map((stage) => (
            <section
              key={stage.etapa}
              className="of-card"
              style={{ margin: 0, minHeight: 460, padding: 10, background: "rgba(14, 26, 48, 0.35)" }}
            >
              <header
                style={{
                  borderRadius: 10,
                  padding: "8px 10px",
                  background: `${stage.color}22`,
                  border: `1px solid ${stage.color}66`,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: stage.color }}>{stage.etapa}</p>
                  <span className="of-badge of-badge-blue">{stage.deals.length}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "1.05rem", fontWeight: 700 }}>{stage.total}</p>
              </header>

              <div style={{ display: "grid", gap: 8 }}>
                <button type="button" className="of-btn-ghost" style={{ width: "100%" }}>
                  + Negocio rapido
                </button>
                {stage.deals.map((deal) => (
                  <article
                    key={`${stage.etapa}-${deal.nome}`}
                    style={{
                      border: "1px solid var(--of-border)",
                      borderRadius: 10,
                      padding: "10px 11px",
                      background: "rgba(8, 16, 34, 0.8)",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>{deal.nome}</p>
                    <p className="of-list-description" style={{ marginTop: 3 }}>{deal.empresa}</p>
                    <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{deal.valor}</p>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {deal.tags.map((tag) => (
                        <span key={`${deal.nome}-${tag}`} className="of-badge of-badge-blue">{tag}</span>
                      ))}
                      <span
                        className="of-badge"
                        style={{
                          border: `1px solid ${prioridadeCor(deal.prioridade)}66`,
                          color: prioridadeCor(deal.prioridade),
                          background: `${prioridadeCor(deal.prioridade)}1f`,
                        }}
                      >
                        Prioridade {deal.prioridade}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--of-text-2)", display: "grid", gap: 2 }}>
                      <span>Responsavel: {deal.responsavel}</span>
                      <span>Ultima atividade: {deal.ultimaAtividade}</span>
                      <span>Prazo: {deal.prazo}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.78rem" }}>
                      <span className="of-list-description">Atividades: {deal.atividades}</span>
                      <button type="button" className="of-btn-ghost" style={{ minHeight: 28, padding: "4px 8px" }}>
                        Abrir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <div className="of-dashboard-grid" style={{ marginTop: 16, marginBottom: 16 }}>
        <article className="of-card">
          <div className="of-card-title">Atividades de hoje</div>
          <ul className="of-list">
            <li className="of-list-item"><p className="of-list-description">10:30 · Follow-up com Vale Norte</p></li>
            <li className="of-list-item"><p className="of-list-description">14:00 · Revisar proposta Jardim Sul</p></li>
            <li className="of-list-item"><p className="of-list-description">16:45 · Call com Clinica Nova Vida</p></li>
          </ul>
        </article>
        <article className="of-card">
          <div className="of-card-title">Negocios sem atividade</div>
          <ul className="of-list">
            <li className="of-list-item"><p className="of-list-description">Reforma Atlas · 4 dias sem contato</p></li>
            <li className="of-list-item"><p className="of-list-description">Galpao Metal Forte · 3 dias sem contato</p></li>
          </ul>
        </article>
      </div>

      <article className="of-card">
        <div className="of-card-title" style={{ marginBottom: 12 }}>
          Viabilidade de importacao (Trello e outros CRMs)
        </div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Origem</th>
                <th>Status</th>
                <th>Como importar</th>
              </tr>
            </thead>
            <tbody>
              {fontesImportacao.map((fonte) => (
                <tr key={fonte.nome}>
                  <td>{fonte.nome}</td>
                  <td>{fonte.status}</td>
                  <td>{fonte.detalhe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
