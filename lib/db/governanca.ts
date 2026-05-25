import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";

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

export async function getTenantRetentionPolicy(): Promise<TenantRetentionPolicy | null> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_retention_policies")
    .select("audit_retention_days, report_retention_days, log_retention_days")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
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
