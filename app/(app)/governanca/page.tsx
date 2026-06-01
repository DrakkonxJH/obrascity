import { listApprovalRequests } from "@/lib/db/approvals";
import { getTenantRetentionPolicy, listExecutiveAlerts, listRecentAuditLogs, listTenantObservabilityEvents } from "@/lib/db/governanca";
import { approveRequestAction, rejectRequestAction, requestExternalSyncAction, saveRetentionPolicyAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function approvalStatusBadge(status: string) {
  if (status === "approved") return "of-badge of-badge-green";
  if (status === "rejected") return "of-badge of-badge-red";
  return "of-badge of-badge-yellow";
}

function approvalStatusLabel(status: string) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Rejeitado";
  return "Pendente";
}

function entityLabel(entityType: string) {
  if (entityType === "purchase_order") return "Pedido de compra";
  if (entityType === "medicao") return "Medição";
  if (entityType === "cronograma_change") return "Mudança de cronograma";
  if (entityType === "change_request") return "Solicitação de mudança";
  if (entityType === "financeiro_titulo") return "Título financeiro";
  if (entityType === "quality_issue") return "Não conformidade";
  if (entityType === "financial_entry") return "Título financeiro";
  return entityType;
}

export default async function GovernancaPage() {
  const [pendingResult, recentResult, retentionResult, auditResult, observabilityResult, alertsResult] = await Promise.allSettled([
    listApprovalRequests({ status: "pending", limit: 30 }),
    listApprovalRequests({ limit: 30 }),
    getTenantRetentionPolicy(),
    listRecentAuditLogs(30),
    listTenantObservabilityEvents(30),
    listExecutiveAlerts(10),
  ]);

  const loadWarnings: string[] = [];
  const pendingRequests =
    pendingResult.status === "fulfilled"
      ? pendingResult.value
      : (loadWarnings.push(
          `Aprovações pendentes indisponíveis: ${pendingResult.reason instanceof Error ? pendingResult.reason.message : "erro desconhecido"}`,
        ),
        []);
  const recentRequests =
    recentResult.status === "fulfilled"
      ? recentResult.value
      : (loadWarnings.push(
          `Histórico de aprovações indisponível: ${recentResult.reason instanceof Error ? recentResult.reason.message : "erro desconhecido"}`,
        ),
        []);
  const retentionPolicy =
    retentionResult.status === "fulfilled"
      ? retentionResult.value
      : (loadWarnings.push(
          `Política de retenção indisponível: ${retentionResult.reason instanceof Error ? retentionResult.reason.message : "erro desconhecido"}`,
        ),
        null);
  const auditLogs =
    auditResult.status === "fulfilled"
      ? auditResult.value
      : (loadWarnings.push(
          `Auditoria indisponível: ${auditResult.reason instanceof Error ? auditResult.reason.message : "erro desconhecido"}`,
        ),
        []);
  const observabilityEvents =
    observabilityResult.status === "fulfilled"
      ? observabilityResult.value
      : (loadWarnings.push(
          `Observabilidade indisponível: ${observabilityResult.reason instanceof Error ? observabilityResult.reason.message : "erro desconhecido"}`,
        ),
        []);
  const executiveAlerts =
    alertsResult.status === "fulfilled"
      ? alertsResult.value
      : (loadWarnings.push(
          `Alertas executivos indisponíveis: ${alertsResult.reason instanceof Error ? alertsResult.reason.message : "erro desconhecido"}`,
        ),
        []);

  const retention = retentionPolicy ?? {
    auditRetentionDays: 365,
    reportRetentionDays: 365,
    logRetentionDays: 180,
  };

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Sistema"
        title="Governança enterprise"
        subtitle="Aprovações por alçada, auditoria imutável, retenção e observabilidade por tenant."
        actions={
          <>
            <Link href="/seguranca-corporativa" className="of-btn-ghost">Segurança</Link>
            <Link href="/configuracoes" className="of-btn-primary">Configurações</Link>
          </>
        }
      />
      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Governança enterprise</div>
        <p className="of-empty-text">
          Central operacional de aprovações por alçada, auditoria imutável com diff e política de retenção por tenant.
        </p>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Alertas executivos proativos</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Severidade</th>
                <th>Alerta</th>
                <th>Detalhe</th>
                <th>Ação recomendada</th>
              </tr>
            </thead>
            <tbody>
              {executiveAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <span
                      className={`of-badge ${alert.severity === "error" ? "of-badge-red" : alert.severity === "warning" ? "of-badge-yellow" : "of-badge-blue"}`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td>{alert.title}</td>
                  <td>{alert.details}</td>
                  <td>{alert.recommendedAction}</td>
                </tr>
              ))}
              {executiveAlerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="of-empty-text">
                    Sem alertas críticos no momento.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
      {loadWarnings.length > 0 ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
          <div className="of-card-title">Parte dos dados não pôde ser carregada</div>
          <ul className="of-list">
            {loadWarnings.map((warning) => (
              <li key={warning} className="of-list-item">
                <p className="of-list-description">{warning}</p>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Aprovações pendentes</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Entidade</th>
                <th>Referência</th>
                <th>Valor</th>
                <th>Alçada exigida</th>
                <th>Solicitante</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr key={request.id}>
                  <td>{entityLabel(request.entity_type)}</td>
                  <td>{request.entity_ref ?? request.entity_id}</td>
                  <td>{money.format(request.amount)}</td>
                  <td>{request.required_role}</td>
                  <td>{request.requester_role}</td>
                  <td>{new Date(request.created_at).toLocaleString("pt-BR")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <form action={approveRequestAction}>
                        <input type="hidden" name="approval_id" value={request.id} />
                        <input type="hidden" name="note" value="Aprovado via painel de governança." />
                        <button type="submit" className="of-btn-primary">
                          Aprovar
                        </button>
                      </form>
                      <form action={rejectRequestAction}>
                        <input type="hidden" name="approval_id" value={request.id} />
                        <input type="hidden" name="note" value="Rejeitado via painel de governança." />
                        <button type="submit" className="of-btn-ghost">
                          Rejeitar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="of-empty-text">
                    Sem solicitações pendentes de aprovação.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Política de retenção por tenant</div>
        <p className="of-empty-text" style={{ marginBottom: 12 }}>
          Define o tempo máximo de retenção para expurgo automático executado pelo worker de manutenção.
        </p>
        <form action={saveRetentionPolicyAction} className="of-form-grid md:grid-cols-4">
          <div>
            <label className="of-form-label" htmlFor="audit-retention-days">
              Auditoria (dias)
            </label>
            <input
              id="audit-retention-days"
              className="of-input"
              name="audit_retention_days"
              type="number"
              min={30}
              max={3650}
              defaultValue={retention.auditRetentionDays}
              required
            />
          </div>
          <div>
            <label className="of-form-label" htmlFor="report-retention-days">
              Relatórios (dias)
            </label>
            <input
              id="report-retention-days"
              className="of-input"
              name="report_retention_days"
              type="number"
              min={30}
              max={3650}
              defaultValue={retention.reportRetentionDays}
              required
            />
          </div>
          <div>
            <label className="of-form-label" htmlFor="log-retention-days">
              Logs (dias)
            </label>
            <input
              id="log-retention-days"
              className="of-input"
              name="log_retention_days"
              type="number"
              min={30}
              max={3650}
              defaultValue={retention.logRetentionDays}
              required
            />
          </div>
          <button type="submit" className="of-btn-primary" style={{ alignSelf: "end", minHeight: 48 }}>
            Salvar política
          </button>
        </form>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Integrações externas (ERP / Fiscal / Bancário)</div>
        <p className="of-empty-text" style={{ marginBottom: 12 }}>
          Dispara solicitações de sincronização e registra trilha operacional em observabilidade.
        </p>
        <form action={requestExternalSyncAction} className="of-form-grid md:grid-cols-4">
          <select name="provider" className="of-input" defaultValue="erp">
            <option value="erp">ERP</option>
            <option value="fiscal">Fiscal</option>
            <option value="bancario">Bancário</option>
          </select>
          <input name="scope" className="of-input md:col-span-2" placeholder="Escopo (ex: contas a pagar, notas fiscais, extrato diário)" />
          <button type="submit" className="of-btn-primary">
            Solicitar sync
          </button>
        </form>
      </article>

      <article className="of-card">
        <div className="of-card-title">Trilha recente de auditoria</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Entidade ID</th>
                <th>Diff</th>
                <th>Autor</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.acao}</td>
                  <td>{log.entidade}</td>
                  <td className="of-mono">{log.entidadeId ?? "—"}</td>
                  <td>{log.diffCount} campos</td>
                  <td className="of-mono">{log.actorId ?? "Sistema"}</td>
                  <td>{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="of-empty-text">
                    Sem eventos de auditoria no período.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="of-card" style={{ marginTop: 16 }}>
        <div className="of-card-title">Observabilidade por tenant</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Evento</th>
                <th>Severidade</th>
                <th>Mensagem</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {observabilityEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.source}</td>
                  <td>{event.eventType}</td>
                  <td>
                    <span className={`of-badge ${event.severity === "error" ? "of-badge-red" : event.severity === "warning" ? "of-badge-yellow" : "of-badge-blue"}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td>{event.message}</td>
                  <td>{new Date(event.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {observabilityEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="of-empty-text">
                    Sem eventos de observabilidade recentes.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="of-card" style={{ marginTop: 16 }}>
        <div className="of-card-title">Histórico de solicitações</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Entidade</th>
                <th>Referência</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Aprovado por</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request.id}>
                  <td>{entityLabel(request.entity_type)}</td>
                  <td>{request.entity_ref ?? request.entity_id}</td>
                  <td>{money.format(request.amount)}</td>
                  <td>
                    <span className={approvalStatusBadge(request.status)}>{approvalStatusLabel(request.status)}</span>
                  </td>
                  <td className="of-mono">{request.approved_by ?? "—"}</td>
                  <td>{new Date(request.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="of-empty-text">
                    Nenhuma solicitação de aprovação registrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
