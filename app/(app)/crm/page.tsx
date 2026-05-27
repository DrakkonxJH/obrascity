import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";

const pipelineStages = ["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechado"];

const funnelStages = [
  { label: "Prospecção", width: "100%", description: "Leads captados para obras e contratos." },
  { label: "Qualificação", width: "84%", description: "Validação de escopo, orçamento e decisores." },
  { label: "Proposta", width: "68%", description: "Estimativas técnicas e comerciais em preparação." },
  { label: "Negociação", width: "52%", description: "Ajustes de prazo, custo e condições contratuais." },
  { label: "Fechado", width: "36%", description: "Conversões concluídas e prontas para onboarding." },
];

export default function CrmPage() {
  return (
    <FeatureGateWrapper feature="api_access">
      <section className="of-page">
        <p className="of-empty-text" style={{ marginBottom: 16 }}>
          CRM comercial para construtoras e incorporadoras, com foco em leads, propostas e relacionamento com clientes.
        </p>

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card">
            <div className="of-stat-value">0</div>
            <div className="of-stat-label">Clientes ativos</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">0</div>
            <div className="of-stat-label">Propostas em andamento</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">0%</div>
            <div className="of-stat-label">Conversão do mês</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">R$ 0,00</div>
            <div className="of-stat-label">Valor em pipeline</div>
          </article>
        </div>

        <article className="of-card">
          <div className="of-card-title">Pipeline de vendas</div>
          <p className="of-empty-text" style={{ marginBottom: 12 }}>
            Integração CRM em configuração — em breve.
          </p>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            {pipelineStages.map((stage) => (
              <article key={stage} className="of-stat-card">
                <div className="of-stat-value">0</div>
                <div className="of-stat-label">{stage}</div>
              </article>
            ))}
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Últimas interações</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Contato</th>
                  <th>Tipo</th>
                  <th>Obra relacionada</th>
                  <th>Data</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="of-empty-text">
                    Nenhuma interação registrada.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="of-empty-text" style={{ marginTop: 12 }}>
            Histórico de contatos e follow-ups será exibido aqui assim que a integração CRM estiver disponível.
          </p>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Funil de conversão</div>
          <div style={{ display: "grid", gap: 10 }}>
            {funnelStages.map((stage) => (
              <div key={stage.label}>
                <div
                  style={{
                    width: stage.width,
                    padding: "12px 16px",
                    borderRadius: 14,
                    background: "rgba(255, 148, 69, 0.12)",
                    border: "1px solid rgba(255, 148, 69, 0.2)",
                  }}
                >
                  <strong>{stage.label}</strong> · 0 oportunidades
                </div>
                <p className="of-empty-text" style={{ marginTop: 6 }}>
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </FeatureGateWrapper>
  );
}
