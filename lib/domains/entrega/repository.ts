import { SupabaseClient } from "@supabase/supabase-js";

export interface IEntregaRepository {
  listComissionamento(empresaId: string): Promise<any[]>;
  createComissionamento(empresaId: string, payload: any): Promise<void>;
  listEntregas(empresaId: string): Promise<any[]>;
  upsertEntrega(empresaId: string, payload: any): Promise<void>;
  countPendingComissionamento(empresaId: string, obraId: string): Promise<number>;
}

export class SupabaseEntregaRepository implements IEntregaRepository {
  constructor(private supabase: SupabaseClient) {}

  async listComissionamento(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("comissionamento_itens")
      .select("id, obra_id, sistema, ambiente, item, status, observacao, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data ?? [];
  }

  async createComissionamento(empresaId: string, payload: any): Promise<void> {
    const { error } = await this.supabase.from("comissionamento_itens").insert(payload);
    if (error) throw error;
  }

  async listEntregas(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("entregas_obra")
      .select("id, obra_id, status, chaves_entregues, data_entrega, aceite_cliente_nome, observacoes, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  }

  async upsertEntrega(empresaId: string, payload: any): Promise<void> {
    const { error } = await this.supabase.from("entregas_obra").upsert(payload, { onConflict: "empresa_id,obra_id" });
    if (error) throw error;
  }

  async countPendingComissionamento(empresaId: string, obraId: string): Promise<number> {
    const { data, error, count } = await this.supabase
      .from("comissionamento_itens")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("obra_id", obraId)
      .in("status", ["pendente", "reprovado"]);
    if (error) throw error;
    return Number(count ?? 0);
  }
}
