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

      <div className="of-dashboard-grid" style={{ marginBottom: 20 }}>
        <article className="of-card">
          <p className="of-card-title">Pipeline</p>
          <p className="of-list-description">Etapas de lead, proposta, negociacao e fechamento.</p>
          <span className="of-badge of-badge-blue">Em configuracao</span>
        </article>
        <article className="of-card">
          <p className="of-card-title">Clientes e contatos</p>
          <p className="of-list-description">Base unica de empresas, decisores, e historico de interacoes.</p>
          <span className="of-badge of-badge-blue">Em configuracao</span>
        </article>
        <article className="of-card">
          <p className="of-card-title">Automacoes</p>
          <p className="of-list-description">Lembretes, follow-ups e alertas de oportunidades paradas.</p>
          <span className="of-badge of-badge-blue">Em configuracao</span>
        </article>
      </div>

      <article className="of-card">
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
