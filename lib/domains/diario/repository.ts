import { SupabaseClient } from "@supabase/supabase-js";
import { DiarioEvidenciaItem } from "./entities";

export interface IDiarioRepository {
  listDiarios(empresaId: string): Promise<any[]>;
  upsertDiario(empresaId: string, payload: any): Promise<any>;
  listProfiles(empresaId: string, ids: string[]): Promise<any[]>;
  listEvidencias(empresaId: string, diarioIds: string[]): Promise<any[]>;
  insertEvidencias(empresaId: string, rows: any[]): Promise<void>;
}

export class SupabaseDiarioRepository implements IDiarioRepository {
  constructor(private supabase: SupabaseClient) {}

  async listDiarios(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("diario_obra")
      .select("id, obra_id, data_ref, clima, efetivo, equipamentos, ocorrencias, observacoes_ssma, assinatura_url, created_by, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("data_ref", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async upsertDiario(empresaId: string, payload: any): Promise<any> {
    const { data, error } = await this.supabase
      .from("diario_obra")
      .upsert(payload, { onConflict: "empresa_id,obra_id,data_ref" })
      .select("id")
      .single();
    if (error) throw error;
    return data;
  }

  async listProfiles(empresaId: string, ids: string[]): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .in("id", ids);
    if (error) throw error;
    return data ?? [];
  }

  async listEvidencias(empresaId: string, diarioIds: string[]): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("diario_evidencias")
      .select("id, diario_id, arquivo_url, descricao, mime_type, size_bytes, created_at")
      .eq("empresa_id", empresaId)
      .in("diario_id", diarioIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async insertEvidencias(empresaId: string, rows: any[]): Promise<void> {
    const { error } = await this.supabase.from("diario_evidencias").insert(rows);
    if (error) throw error;
  }
}
