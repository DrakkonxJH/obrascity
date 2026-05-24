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

const pipeline = [
  {
    etapa: "Leads",
    total: 4,
    cards: [
      { nome: "Residencial Aurora", responsavel: "Julio", valor: "R$ 180.000" },
      { nome: "Condominio Vale Norte", responsavel: "Admin", valor: "R$ 420.000" },
    ],
  },
  {
    etapa: "Contato",
    total: 3,
    cards: [
      { nome: "Galpao Metal Forte", responsavel: "Julio", valor: "R$ 95.000" },
      { nome: "Reforma Atlas", responsavel: "Admin", valor: "R$ 62.000" },
    ],
  },
  {
    etapa: "Proposta",
    total: 2,
    cards: [
      { nome: "Complexo Jardim Sul", responsavel: "Julio", valor: "R$ 760.000" },
    ],
  },
  {
    etapa: "Negociacao",
    total: 2,
    cards: [
      { nome: "Clinica Nova Vida", responsavel: "Admin", valor: "R$ 210.000" },
    ],
  },
  {
    etapa: "Fechado",
    total: 1,
    cards: [
      { nome: "Obra Escola Centro", responsavel: "Julio", valor: "R$ 340.000" },
    ],
  },
];

export default function CrmPage() {
  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 20, alignItems: "flex-start" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            CRM de Obras
          </h1>
          <p className="of-empty-text">
            Novo modulo para pipeline comercial, contatos, propostas e relacionamento com clientes.
          </p>
        </div>
      </div>

      <div className="of-kpi-grid" style={{ marginBottom: 20 }}>
        <article className="of-metric-card blue">
          <p className="of-kpi-label">Leads ativos</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>12</p>
          <p className="of-metric-change">5 em follow-up</p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">Negocios em proposta</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>4</p>
          <p className="of-metric-change">R$ 1.180.000 em potencial</p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-label">Conversao</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>32%</p>
          <p className="of-metric-change">ultimos 30 dias</p>
        </article>
      </div>

      <article className="of-card">
        <div className="of-card-title" style={{ marginBottom: 12 }}>
          Pipeline comercial (visao horizontal)
        </div>
        <p className="of-list-description" style={{ marginBottom: 12 }}>
          Organizacao em colunas no estilo CRM para acompanhar cada oportunidade por etapa.
        </p>
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(230px, 1fr)",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 6,
          }}
        >
          {pipeline.map((coluna) => (
            <section
              key={coluna.etapa}
              className="of-card"
              style={{ margin: 0, minHeight: 300, background: "rgba(14, 26, 48, 0.45)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <p className="of-card-title" style={{ margin: 0 }}>{coluna.etapa}</p>
                <span className="of-badge of-badge-blue">{coluna.total}</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {coluna.cards.map((card) => (
                  <article
                    key={`${coluna.etapa}-${card.nome}`}
                    style={{
                      border: "1px solid var(--of-border)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "rgba(5, 13, 28, 0.7)",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600 }}>{card.nome}</p>
                    <p className="of-list-description" style={{ marginTop: 6 }}>
                      Responsavel: {card.responsavel}
                    </p>
                    <p className="of-list-description" style={{ marginTop: 2 }}>
                      Valor estimado: {card.valor}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title" style={{ marginBottom: 12 }}>
          Viabilidade de importacao
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
