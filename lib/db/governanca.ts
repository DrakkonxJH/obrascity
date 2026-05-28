import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingRelation } from "@/lib/db/migration-guard";

export type TenantRetentionPolicy = {
  auditRetentionDays: number;
  reportRetentionDays: number;
  logRetentionDays: number;
};

export type AuditLogItem = {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  actorId: string | null;
  createdAt: string;
  diffCount: number;
};

export type TenantObservabilityEventItem = {
  id: string;
  source: string;
  eventType: string;
  severity: string;
  message: string;
  createdAt: string;
};

export type ExecutiveAlertItem = {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  details: string;
  recommendedAction: string;
};


export async function getTenantRetentionPolicy(): Promise<TenantRetentionPolicy | null> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_retention_policies")
    .select("audit_retention_days, report_retention_days, log_retention_days")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error.message)) return null;
    throw new Error(`Erro ao carregar política de retenção: ${error.message}`);
  }
  if (!data) return null;

  return {
    auditRetentionDays: Number(data.audit_retention_days ?? 365),
    reportRetentionDays: Number(data.report_retention_days ?? 365),
    logRetentionDays: Number(data.log_retention_days ?? 180),
  };
}

export async function upsertTenantRetentionPolicy(input: TenantRetentionPolicy) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("tenant_retention_policies").upsert(
    {
      empresa_id: empresaId,
      audit_retention_days: input.auditRetentionDays,
      report_retention_days: input.reportRetentionDays,
      log_retention_days: input.logRetentionDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id" },
  );

  if (error) {
    if (isMissingRelation(error.message)) {
      console.warn("[governanca] tabela tenant_retention_policies ausente, retornando sem persistir.");
      return;
    }
    throw new Error(`Erro ao salvar política de retenção: ${error.message}`);
  }
}

export async function listRecentAuditLogs(limit = 30): Promise<AuditLogItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const maxRows = Math.min(Math.max(limit, 1), 200);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, acao, entidade, entidade_id, actor_id, metadata, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(maxRows);

  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(`Erro ao listar auditoria: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
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

export async function listTenantObservabilityEvents(limit = 30): Promise<TenantObservabilityEventItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const maxRows = Math.min(Math.max(limit, 1), 200);
  const { data, error } = await supabase
    .from("tenant_observability_events")
    .select("id, source, event_type, severity, message, created_at")
    .or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(maxRows);

  if (error) {
    if (isMissingRelation(error.message)) {
      return [];
    }
    throw new Error(`Erro ao listar eventos de observabilidade: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    source: String(row.source ?? ""),
    eventType: String(row.event_type ?? ""),
    severity: String(row.severity ?? "info"),
    message: String(row.message ?? ""),
    createdAt: String(row.created_at ?? ""),
  }));
}

export async function registerExternalSyncEvent(input: {
  provider: "erp" | "fiscal" | "bancario";
  scope: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("tenant_observability_events").insert({
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
  });
  if (error) {
    if (isMissingRelation(error.message)) return;
    throw new Error(`Erro ao registrar solicitação de sync externo: ${error.message}`);
  }
}

export async function listExecutiveAlerts(limit = 8): Promise<ExecutiveAlertItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const [ncRes, approvalsRes, financeiroRes, garantiaRes, entregaRes] = await Promise.all([
    supabase.from("nao_conformidades").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).in("status", ["aberta", "em_tratamento"]),
    supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("status", "pending"),
    supabase
      .from("financeiro_titulos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["previsto", "aprovado"])
      .lt("vencimento", new Date().toISOString().slice(0, 10)),
    supabase
      .from("garantia_chamados")
      .select("id, prazo_solucao_em, prazo_resposta_em, status")
      .eq("empresa_id", empresaId)
      .neq("status", "resolvido")
      .limit(300),
    supabase
      .from("comissionamento_itens")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["pendente", "reprovado"]),
  ]);

  const alerts: ExecutiveAlertItem[] = [];

  const ncOpen = Number(ncRes.count ?? 0);
  if (ncOpen > 0) {
    alerts.push({
      id: "nc-open",
      severity: ncOpen > 8 ? "error" : "warning",
      title: "Não conformidades abertas",
      details: `${ncOpen} NCs sem encerramento.`,
      recommendedAction: "Priorizar plano de ação das NCs críticas e vincular responsáveis com prazo.",
    });
  }

  const approvalsPending = Number(approvalsRes.count ?? 0);
  if (approvalsPending > 0) {
    alerts.push({
      id: "approvals-pending",
      severity: approvalsPending > 10 ? "error" : "warning",
      title: "Aprovações pendentes",
      details: `${approvalsPending} solicitações aguardando alçada.`,
      recommendedAction: "Executar rodada de aprovação/rejeição para evitar bloqueio de operação.",
    });
  }

  const financeiroAtrasado = Number(financeiroRes.count ?? 0);
  if (financeiroAtrasado > 0) {
    alerts.push({
      id: "finance-overdue",
      severity: financeiroAtrasado > 5 ? "error" : "warning",
      title: "Títulos financeiros vencidos",
      details: `${financeiroAtrasado} títulos previstos/aprovados já vencidos.`,
      recommendedAction: "Replanejar caixa e liquidar/renegociar títulos críticos.",
    });
  }

  if (!garantiaRes.error) {
    const now = Date.now();
    const garantiaOverdue = (garantiaRes.data ?? []).filter((row) => {
      const prazo = String(row.prazo_solucao_em ?? row.prazo_resposta_em ?? "");
      if (!prazo) return false;
      const t = new Date(prazo).getTime();
      return Number.isFinite(t) && t < now;
    }).length;
    if (garantiaOverdue > 0) {
      alerts.push({
        id: "garantia-overdue",
        severity: garantiaOverdue > 3 ? "error" : "warning",
        title: "SLA de garantia em risco",
        details: `${garantiaOverdue} chamados já ultrapassaram prazo.`,
        recommendedAction: "Escalonar atendimento e atualizar comunicação com cliente.",
      });
    }
  }

  const comissionamentoPendente = Number(entregaRes.count ?? 0);
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
