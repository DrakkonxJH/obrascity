import { IGovernancaRepository } from "./repository";
import {
  TenantRetentionPolicy,
  AuditLogItem,
  TenantObservabilityEventItem,
  ExecutiveAlertItem,
  UpsertRetentionPolicyInput,
  RegisterSyncEventInput,
} from "./entities";

export interface GovernancaDeps {
  getEmpresaId: () => Promise<string>;
  isMissingRelation: (errorMessage: string) => boolean;
}

export class GovernancaService {
  constructor(
    private repository: IGovernancaRepository,
    private deps: GovernancaDeps
  ) {}

  async getRetentionPolicy(): Promise<TenantRetentionPolicy | null> {
    const empresaId = await this.deps.getEmpresaId();
    const data = await this.repository.getRetentionPolicy(empresaId).catch(e => {
      if (this.deps.isMissingRelation(e.message)) return null;
      throw new Error(`Erro ao carregar política de retenção: ${e.message}`);
    });

    if (!data) return null;
    return {
      auditRetentionDays: Number(data.audit_retention_days ?? 365),
      reportRetentionDays: Number(data.report_retention_days ?? 365),
      logRetentionDays: Number(data.log_retention_days ?? 180),
    };
  }

  async upsertRetentionPolicy(input: UpsertRetentionPolicyInput): Promise<void> {
    const empresaId = await this.deps.getEmpresaId();
    const payload = {
      empresa_id: empresaId,
      audit_retention_days: input.auditRetentionDays,
      report_retention_days: input.reportRetentionDays,
      log_retention_days: input.logRetentionDays,
      updated_at: new Date().toISOString(),
    };

    await this.repository.upsertRetentionPolicy(empresaId, payload).catch(e => {
      if (this.deps.isMissingRelation(e.message)) {
        console.warn("[governanca] tabela tenant_retention_policies ausente, retornando sem persistir.");
        return;
      }
      throw new Error(`Erro ao salvar política de retenção: ${e.message}`);
    });
  }

  async listRecentAuditLogs(limit = 30): Promise<AuditLogItem[]> {
    const empresaId = await this.deps.getEmpresaId();
    const maxRows = Math.min(Math.max(limit, 1), 200);
    const data = await this.repository.listAuditLogs(empresaId, maxRows).catch(e => {
      if (this.deps.isMissingRelation(e.message)) return [];
      throw new Error(`Erro ao listar auditoria: ${e.message}`);
    });

    return (data ?? []).map((row) => {
      const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
      const diff = metadata.diff as Record<string, unknown> | undefined;
      return {
        id: String(row.id ?? ""),
        acao: String(row.acao ?? ""),
        entidade: String(row.entidade ?? ""),
        entidadeId: row.entidade_id ? String(row.entidade_id) : null,
        actorId: row.actor_id ? String(row.actor_id) : null,
        createdAt: String(row.created_at ?? ""),
        diffCount: diff ? Object.keys(diff).length : 0,
      };
    });
  }

  async listObservabilityEvents(limit = 30): Promise<TenantObservabilityEventItem[]> {
    const empresaId = await this.deps.getEmpresaId();
    const maxRows = Math.min(Math.max(limit, 1), 200);
    const data = await this.repository.listObservabilityEvents(empresaId, maxRows).catch(e => {
      if (this.deps.isMissingRelation(e.message)) return [];
      throw new Error(`Erro ao listar eventos de observabilidade: ${e.message}`);
    });

    return (data ?? []).map((row) => ({
      id: String(row.id ?? ""),
      source: String(row.source ?? ""),
      eventType: String(row.event_type ?? ""),
      severity: String(row.severity ?? "info"),
      message: String(row.message ?? ""),
      createdAt: String(row.created_at ?? ""),
    }));
  }

  async registerExternalSyncEvent(input: RegisterSyncEventInput): Promise<void> {
    const empresaId = await this.deps.getEmpresaId();
    const payload = {
      empresa_id: empresaId,
      source: "integracao-externa",
      event_type: `${input.provider}_sync_requested`,
      severity: "info",
      message: `Sync ${input.provider.toUpperCase()} solicitado para escopo "${input.scope}".`,
      metadata: {
        provider: input.provider,
        scope: input.scope,
        requested_at: new Date().toISOString(),
      },
    };

    await this.repository.registerSyncEvent(empresaId, payload).catch(e => {
      if (this.deps.isMissingRelation(e.message)) return;
      throw new Error(`Erro ao registrar solicitação de sync externo: ${e.message}`);
    });
  }

  async listExecutiveAlerts(limit = 8): Promise<ExecutiveAlertItem[]> {
    const empresaId = await this.deps.getEmpresaId();
    const [ncOpen, approvalsPending, financeiroAtrasado, garantiaChamados, comissionamentoPendente] = await Promise.all([
      this.repository.countOpenNCs(empresaId),
      this.repository.countPendingApprovals(empresaId),
      this.repository.countOverdueFinance(empresaId),
      this.repository.listGarantiaChamados(empresaId),
      this.repository.countPendingComissionamento(empresaId),
    ]);

    const alerts: ExecutiveAlertItem[] = [];

    if (ncOpen > 0) {
      alerts.push({
        id: "nc-open",
        severity: ncOpen > 8 ? "error" : "warning",
        title: "Não conformidades abertas",
        details: `${ncOpen} NCs sem encerramento.`,
        recommendedAction: "Priorizar plano de ação das NCs críticas e vincular responsáveis com prazo.",
      });
    }

    if (approvalsPending > 0) {
      alerts.push({
        id: "approvals-pending",
        severity: approvalsPending > 10 ? "error" : "warning",
        title: "Aprovações pendentes",
        details: `${approvalsPending} solicitações aguardando alçada.`,
        recommendedAction: "Executar rodada de aprovação/rejeição para evitar bloqueio de operação.",
      });
    }

    if (financeiroAtrasado > 0) {
      alerts.push({
        id: "finance-overdue",
        severity: financeiroAtrasado > 5 ? "error" : "warning",
        title: "Títulos financeiros vencidos",
        details: `${financeiroAtrasado} títulos previstos/aprovados já vencidos.`,
        recommendedAction: "Replanejar caixa e liquidar/renegociar títulos críticos.",
      });
    }

    if (garantiaChamados.length > 0) {
      const now = Date.now();
      const overdue = garantiaChamados.filter((row) => {
        const prazo = String(row.prazo_solucao_em ?? row.prazo_resposta_em ?? "");
        if (!prazo) return false;
        const t = new Date(prazo).getTime();
        return Number.isFinite(t) && t < now;
      }).length;
      if (overdue > 0) {
        alerts.push({
          id: "garantia-overdue",
          severity: overdue > 3 ? "error" : "warning",
          title: "SLA de garantia em risco",
          details: `${overdue} chamados já ultrapassaram prazo.`,
          recommendedAction: "Escalonar atendimento e atualizar comunicação com cliente.",
        });
      }
    }

    if (comissionamentoPendente > 0) {
      alerts.push({
        id: "comissionamento-pendente",
        severity: comissionamentoPendente > 4 ? "warning" : "info",
        title: "Comissionamento pendente",
        details: `${comissionamentoPendente} itens ainda pendentes/reprovados.`,
        recommendedAction: "Fechar checklist por sistema antes de concluir novas entregas.",
      });
    }

    return alerts.slice(0, Math.max(1, limit));
  }
}
