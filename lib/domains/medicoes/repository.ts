import { SupabaseClient } from "@supabase/supabase-js";
import { MedicaoItem, CreateMedicaoInput } from "./entities";

export interface IMedicoesRepository {
  listMedicoes(empresaId: string): Promise<any[]>;
  createMedicao(empresaId: string, input: CreateMedicaoInput): Promise<{ id: string }>;
  getFinanceiroResumo(empresaId: string): Promise<any[]>;
}

export class SupabaseMedicoesRepository implements IMedicoesRepository {
  constructor(private supabase: SupabaseClient) {}

  async listMedicoes(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("medicoes")
      .select("id, obra_id, referencia, valor, retencao, aditivo, status, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async createMedicao(empresaId: string, input: CreateMedicaoInput): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("medicoes")
      .insert({
        empresa_id: empresaId,
        obra_id: input.obraId,
        referencia: input.referencia,
        valor: input.valor,
        retencao: input.retencao,
        aditivo: input.aditivo,
        status: input.status ?? "rascunho",
      })
      .select("id")
      .single();

    if (error || !data?.id) throw new Error(error?.message ?? "Erro ao criar medição");
    return data;
  }

  async getFinanceiroResumo(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("obras_financeiro")
      .select("orcado, realizado")
      .eq("empresa_id", empresaId);

    if (error) throw error;
    return data ?? [];
  }
}
