import { SupabaseClient } from "@supabase/supabase-js";

export interface IGovernancaRepository {
  getRetentionPolicy(empresaId: string): Promise<any | null>;
  upsertRetentionPolicy(empresaId: string, payload: any): Promise<void>;
  listAuditLogs(empresaId: string, limit: number): Promise<any[]>;
  listObservabilityEvents(empresaId: string, limit: number): Promise<any[]>;
  registerSyncEvent(empresaId: string, payload: any): Promise<void>;
  countOpenNCs(empresaId: string): Promise<number>;
  countPendingApprovals(empresaId: string): Promise<number>;
  countOverdueFinance(empresaId: string): Promise<number>;
  listGarantiaChamados(empresaId: string): Promise<any[]>;
  countPendingComissionamento(empresaId: string): Promise<number>;
}

export class SupabaseGovernancaRepository implements IGovernancaRepository {
  constructor(private supabase: SupabaseClient) {}

  async getRetentionPolicy(empresaId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from("tenant_retention_policies")
      .select("audit_retention_days, report_retention_days, log_retention_days")
      .eq("empresa_id", empresaId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async upsertRetentionPolicy(empresaId: string, payload: any): Promise<void> {
    const { error } = await this.supabase.from("tenant_retention_policies").upsert(payload, { onConflict: "empresa_id" });
    if (error) throw error;
  }

  async listAuditLogs(empresaId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("id, acao, entidade, entidade_id, actor_id, metadata, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async listObservabilityEvents(empresaId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("tenant_observability_events")
      .select("id, source, event_type, severity, message, created_at")
      .or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async registerSyncEvent(empresaId: string, payload: any): Promise<void> {
    const { error } = await this.supabase.from("tenant_observability_events").insert(payload);
    if (error) throw error;
  }

  async countOpenNCs(empresaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("nao_conformidades")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["aberta", "em_tratamento"]);
    if (error) throw error;
    return Number(count ?? 0);
  }

  async countPendingApprovals(empresaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "pending");
    if (error) throw error;
    return Number(count ?? 0);
  }

  async countOverdueFinance(empresaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("financeiro_titulos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["previsto", "aprovado"])
      .lt("vencimento", new Date().toISOString().slice(0, 10));
    if (error) throw error;
    return Number(count ?? 0);
  }

  async listGarantiaChamados(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("garantia_chamados")
      .select("id, prazo_solucao_em, prazo_resposta_em, status")
      .eq("empresa_id", empresaId)
      .neq("status", "resolvido")
      .limit(300);
    if (error) throw error;
    return data ?? [];
  }

  async countPendingComissionamento(empresaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("comissionamento_itens")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["pendente", "reprovado"]);
    if (error) throw error;
    return Number(count ?? 0);
  }
}
