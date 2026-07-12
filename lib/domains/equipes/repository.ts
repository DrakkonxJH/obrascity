import { SupabaseClient } from "@supabase/supabase-js";
import {
  EquipeItem,
  MembroItem,
  CreateEquipeInput,
  CreateMembroInput
} from "./entities";

export interface IEquipesRepository {
  listEquipes(empresaId: string): Promise<EquipeItem[]>;
  listMembros(empresaId: string): Promise<any[]>;
  createEquipe(empresaId: string, input: CreateEquipeInput): Promise<void>;
  createMembro(empresaId: string, input: CreateMembroInput): Promise<void>;
}

export class SupabaseEquipesRepository implements IEquipesRepository {
  constructor(private supabase: SupabaseClient) {}

  async listEquipes(empresaId: string): Promise<EquipeItem[]> {
    const { data, error } = await this.supabase
      .from("equipes")
      .select("id, nome, especialidade")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (error) throw error;
    return (data ?? []) as EquipeItem[];
  }

  async listMembros(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("membros")
      .select("id, profile_id, equipe_id, cargo, crea, profiles(nome, email)")
      .eq("empresa_id", empresaId);

    if (error) throw error;
    return data ?? [];
  }

  async createEquipe(empresaId: string, input: CreateEquipeInput): Promise<void> {
    const { error } = await this.supabase.from("equipes").insert({
      empresa_id: empresaId,
      nome: input.nome,
      especialidade: input.especialidade ?? null,
    });
    if (error) throw error;
  }

  async createMembro(empresaId: string, input: CreateMembroInput): Promise<void> {
    const { error } = await this.supabase.from("membros").insert({
      empresa_id: empresaId,
      cargo: input.cargo,
      crea: input.crea ?? null,
      equipe_id: input.equipeId ?? null,
    });
    if (error) throw error;
  }
}
