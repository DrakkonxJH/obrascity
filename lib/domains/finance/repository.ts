import { SupabaseClient } from "@supabase/supabase-js";
import {
  FinanceiroItem,
  FinanceiroInput,
  FinanceiroUpdateInput
} from "./entities";

export interface IFinanceRepository {
  list(empresaId: string): Promise<any[]>;
  create(empresaId: string, input: FinanceiroInput): Promise<void>;
  update(empresaId: string, input: FinanceiroUpdateInput): Promise<boolean>;
}

export class SupabaseFinanceRepository implements IFinanceRepository {
  constructor(private supabase: SupabaseClient) {}

  async list(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("obras_financeiro")
      .select("id, obra_id, categoria, orcado, realizado, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(empresaId: string, input: FinanceiroInput): Promise<void> {
    const { error } = await this.supabase.from("obras_financeiro").insert({
      empresa_id: empresaId,
      obra_id: input.obraId,
      categoria: input.categoria,
      orcado: input.orcado,
      realizado: input.realizado,
    });
    if (error) throw error;
  }

  async update(empresaId: string, input: FinanceiroUpdateInput): Promise<boolean> {
    const { error, data } = await this.supabase
      .from("obras_financeiro")
      .update({
        categoria: input.categoria,
        orcado: input.orcado,
        realizado: input.realizado,
      })
      .eq("empresa_id", empresaId)
      .eq("obra_id", input.obraId)
      .eq("id", input.id)
      .select("id");

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }
}
