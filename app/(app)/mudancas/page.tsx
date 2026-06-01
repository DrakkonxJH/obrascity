import type { CSSProperties } from "react";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { listApprovalRequests } from "@/lib/db/approvals";
import { listObras } from "@/lib/db/obras";
import { listMudancas } from "@/lib/db/mudancas";
import { approveMudancaRequestAction, createMudancaAction, rejectMudancaRequestAction } from "./actions";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const tipoLabels: Record<string, string> = {
  escopo: "Escopo",
  prazo: "Prazo",
  custo: "Custo",
  contratual: "Contratual",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_aprovacao: "Em aprovação",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

const statusBadgeClass: Record<string, string> = {
  pendente: "of-badge-warning",
  em_aprovacao: "of-badge-warning",
  aprovada: "of-badge-success",
  rejeitada: "of-badge-error",
};

type MudancasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function MudancasPage({ searchParams }: MudancasPageProps) {
  const params = searchParams ? await searchParams : {};
  const obraFilter = firstParam(params.obra_id);
  const tipoFilter = firstParam(params.tipo);
  const statusFilter = firstParam(params.status);
  const query = firstParam(params.q).toLowerCase().trim();

  const [obrasResult, mudancasResult, approvalsResult] = await Promise.allSettled([
    listObras(),
    listMudancas(),
    listApprovalRequests({ status: "pending", limit: 200 }),
  ]);
  const warnings: string[] = [];

  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para mudanças."), []);
  const mudancas =
    mudancasResult.status === "fulfilled"
      ? mudancasResult.value
      : (warnings.push("Falha ao carregar mudanças registradas (verifique migrations)."), []);
  const pendingApprovals =
    approvalsResult.status === "fulfilled"
      ? approvalsResult.value.filter((item) => item.entity_type === "cronograma_change")
      : (warnings.push("Falha ao carregar fila de aprovações para mudanças."), []);

  const pendentesAprovacao = mudancas.filter((item) => ["pendente", "em_aprovacao"].includes(item.status)).length;
  const aprovadas = mudancas.filter((item) => item.status === "aprovada").length;
  const rejeitadas = mudancas.filter((item) => item.status === "rejeitada").length;
  const impactoTotalPrazo = mudancas.reduce((acc, item) => acc + item.impacto_prazo_dias, 0);
  const impactoTotalCusto = mudancas.reduce((acc, item) => acc + item.impacto_custo, 0);
  const impactoAprovado = mudancas
    .filter((item) => item.status === "aprovada")
    .reduce((acc, item) => acc + item.impacto_custo, 0);

  const distribuicaoPorTipo = ["escopo", "prazo", "custo", "contratual"].map((tipo) => ({
    tipo,
    total: mudancas.filter((item) => item.tipo === tipo).length,
  }));

  const filteredMudancas = mudancas
    .filter((item) => (obraFilter ? item.obra_id === obraFilter : true))
    .filter((item) => (tipoFilter ? item.tipo === tipoFilter : true))
    .filter((item) => (statusFilter ? item.status === statusFilter : true))
    .filter((item) => {
      if (!query) return true;
      const source = `${item.obra_nome} ${item.titulo} ${item.descricao}`.toLowerCase();
      return source.includes(query);
    })
    .sort((a, b) => {
      const pa = (a.status === "em_aprovacao" ? 2 : 0) + (a.status === "pendente" ? 1 : 0);
      const pb = (b.status === "em_aprovacao" ? 2 : 0) + (b.status === "pendente" ? 1 : 0);
      if (pb !== pa) return pb - pa;
      return b.impacto_custo - a.impacto_custo;
    });

  const obraRanking = Object.values(
    mudancas.reduce<Record<string, { obraNome: string; total: number; custo: number }>>((acc, item) => {
      const key = item.obra_id || item.obra_nome;
      if (!acc[key]) {
        acc[key] = { obraNome: item.obra_nome, total: 0, custo: 0 };
      }
      acc[key].total += 1;
      acc[key].custo += item.impacto_custo;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.custo - a.custo)
    .slice(0, 5);

  const statCardStyle: CSSProperties = {
    border: "1px solid var(--of-border)",
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(20, 28, 46, 0.9), rgba(12, 18, 32, 0.92))",
    padding: "14px 16px",
  };

  const statValueStyle: CSSProperties = {
    fontFamily: "\"Barlow Condensed\", sans-serif",
    fontSize: "2rem",
    lineHeight: 1,
    color: "#f1f4ff",
  };

  const statLabelStyle: CSSProperties = {
    marginTop: 6,
    fontSize: "0.78rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--of-text-2)",
  };

  return (
    <FeatureGateWrapper feature="automacoes_workflow">
      <section className="of-page">
        <PageHeader title="Mudanças" />

        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{mudancas.length}</div>
            <div className="of-stat-label" style={statLabelStyle}>Total de mudanças</div>
          </article>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{pendentesAprovacao}</div>
            <div className="of-stat-label" style={statLabelStyle}>Pendentes de aprovação</div>
          </article>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{aprovadas}</div>
            <div className="of-stat-label" style={statLabelStyle}>Aprovadas</div>
          </article>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{rejeitadas}</div>
            <div className="of-stat-label" style={statLabelStyle}>Rejeitadas</div>
          </article>
        </div>

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{impactoTotalPrazo}</div>
            <div className="of-stat-label" style={statLabelStyle}>Impacto total de prazo (dias)</div>
          </article>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{money.format(impactoTotalCusto)}</div>
            <div className="of-stat-label" style={statLabelStyle}>Impacto total de custo</div>
          </article>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{money.format(impactoAprovado)}</div>
            <div className="of-stat-label" style={statLabelStyle}>Impacto aprovado</div>
          </article>
          <article className="of-stat-card" style={statCardStyle}>
            <div className="of-stat-value" style={statValueStyle}>{pendingApprovals.length}</div>
            <div className="of-stat-label" style={statLabelStyle}>Na fila de alçada</div>
          </article>
        </div>

        <article className="of-card" style={{ marginBottom: 16 }}>
          <div className="of-card-title">Filtros operacionais</div>
          <form action="/mudancas" className="of-form-grid md:grid-cols-5" style={{ marginTop: 12 }}>
            <select name="obra_id" className="of-input" defaultValue={obraFilter}>
              <option value="">Todas as obras</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </select>
            <select name="tipo" className="of-input" defaultValue={tipoFilter}>
              <option value="">Todos os tipos</option>
              <option value="escopo">Escopo</option>
              <option value="prazo">Prazo</option>
              <option value="custo">Custo</option>
              <option value="contratual">Contratual</option>
            </select>
            <select name="status" className="of-input" defaultValue={statusFilter}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_aprovacao">Em aprovação</option>
              <option value="aprovada">Aprovada</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
            <input name="q" className="of-input" defaultValue={query} placeholder="Buscar por obra, título ou descrição" />
            <button type="submit" className="of-btn-primary">Aplicar filtros</button>
          </form>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createMudancaAction} className="of-card of-form-grid md:grid-cols-3">
            <div className="of-card-title md:col-span-3">Nova solicitação de mudança</div>
            <select name="obra_id" className="of-input" defaultValue="" required>
              <option value="" disabled>Obra</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>{obra.nome}</option>
              ))}
            </select>
            <select name="tipo" className="of-input" defaultValue="escopo">
              <option value="escopo">Escopo</option>
              <option value="prazo">Prazo</option>
              <option value="custo">Custo</option>
              <option value="contratual">Contratual</option>
            </select>
            <input name="titulo" className="of-input" placeholder="Título da mudança" required />
            <input name="descricao" className="of-input md:col-span-3" placeholder="Descrição detalhada" required />
            <input name="impacto_prazo_dias" type="number" min={0} className="of-input" placeholder="Impacto de prazo (dias)" />
            <input name="impacto_custo" type="number" min={0} step="0.01" className="of-input" placeholder="Impacto de custo" />
            <button type="submit" className="of-btn-primary">Abrir solicitação</button>
          </form>

          <article className="of-card">
            <div className="of-card-title">Distribuição por tipo</div>
            <div className="of-stats-grid" style={{ marginTop: 12 }}>
              {distribuicaoPorTipo.map((item) => (
                <article key={item.tipo} className="of-stat-card" style={statCardStyle}>
                  <div className="of-stat-value" style={statValueStyle}>{item.total}</div>
                  <div className="of-stat-label" style={statLabelStyle}>{tipoLabels[item.tipo] ?? item.tipo}</div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2" style={{ marginTop: 20 }}>
          <article className="of-card">
            <div className="of-card-title">Fila de aprovação (alçada)</div>
            <div className="of-table-wrap" style={{ border: 0, marginTop: 10 }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Referência</th>
                    <th>Valor</th>
                    <th>Alçada</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((request) => (
                    <tr key={request.id}>
                      <td>{request.entity_ref ?? request.entity_id}</td>
                      <td>{money.format(request.amount)}</td>
                      <td>{request.required_role}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <form action={approveMudancaRequestAction}>
                            <input type="hidden" name="approval_id" value={request.id} />
                            <button type="submit" className="of-btn-primary">Aprovar</button>
                          </form>
                          <form action={rejectMudancaRequestAction}>
                            <input type="hidden" name="approval_id" value={request.id} />
                            <button type="submit" className="of-btn-ghost">Rejeitar</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="of-empty-text">Sem solicitações pendentes de aprovação.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>

          <article className="of-card">
            <div className="of-card-title">Obras com maior impacto</div>
            <div className="of-table-wrap" style={{ border: 0, marginTop: 10 }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Obra</th>
                    <th>Total de mudanças</th>
                    <th>Impacto de custo</th>
                  </tr>
                </thead>
                <tbody>
                  {obraRanking.map((item) => (
                    <tr key={item.obraNome}>
                      <td>{item.obraNome}</td>
                      <td className="of-mono">{item.total}</td>
                      <td>{money.format(item.custo)}</td>
                    </tr>
                  ))}
                  {obraRanking.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="of-empty-text">Sem dados suficientes para ranking por obra.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Solicitações registradas ({filteredMudancas.length})</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Prazo</th>
                  <th>Custo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMudancas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td><span className="of-badge of-badge-default">{tipoLabels[item.tipo] ?? item.tipo}</span></td>
                    <td>{item.titulo}</td>
                    <td className="of-mono">{item.impacto_prazo_dias} dias</td>
                    <td>{money.format(item.impacto_custo)}</td>
                    <td>
                      <span className={`of-badge ${statusBadgeClass[item.status] ?? "of-badge-default"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredMudancas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">Nenhuma solicitação encontrada para os filtros selecionados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </FeatureGateWrapper>
  );
}
