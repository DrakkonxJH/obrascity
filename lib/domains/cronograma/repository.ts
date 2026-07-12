import { SupabaseClient } from "@supabase/supabase-js";
import {
  CronogramaItem,
  CronogramaDependencia,
  ReplanejamentoItem,
  CronogramaBaselineItem,
  CreateTarefaInput,
  UpdateTarefaInput,
  CreateDependenciaInput,
  CreateReplanejamentoInput
} from "./entities";

export interface ICronogramaRepository {
  listTarefas(empresaId: string): Promise<any[]>;
  createTarefa(empresaId: string, input: CreateTarefaInput): Promise<{ id: string }>;
  updateTarefa(empresaId: string, input: UpdateTarefaInput): Promise<{ id: string; obraId: string }>;
  deleteTarefa(empresaId: string, id: string): Promise<void>;
  listDependencias(empresaId: string): Promise<any[]>;
  createDependencia(empresaId: string, input: CreateDependenciaInput): Promise<void>;
  snapshotBaseline(empresaId: string, obraId: string, tarefas: any[], nextVersao: number): Promise<void>;
  getLatestBaselines(empresaId: string): Promise<any[]>;
  listReplanejamentos(empresaId: string): Promise<any[]>;
  createReplanejamento(empresaId: string, input: CreateReplanejamentoInput): Promise<{ id: string }>;
}

export class SupabaseCronogramaRepository implements ICronogramaRepository {
  constructor(private supabase: SupabaseClient) {}

  async listTarefas(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("obras_tarefas")
      .select("id, obra_id, nome, inicio, fim, status, updated_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("inicio", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async createTarefa(empresaId: string, input: CreateTarefaInput): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("obras_tarefas")
      .insert({
        empresa_id: empresaId,
        obra_id: input.obraId,
        nome: input.nome,
        inicio: input.inicio,
        fim: input.fim,
        status: input.status ?? "planejado",
      })
      .select("id")
      .single();

    if (error || !data?.id) throw new Error(error?.message ?? "Falha ao criar tarefa");
    return data;
  }

  async updateTarefa(empresaId: string, input: UpdateTarefaInput): Promise<{ id: string; obraId: string }> {
    const { data, error } = await this.supabase
      .from("obras_tarefas")
      .update({
        nome: input.nome,
        inicio: input.inicio,
        fim: input.fim,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresaId)
      .eq("id", input.id)
      .select("id, obra_id")
      .single();

    if (error || !data?.id) throw new Error(error?.message ?? "Tarefa não encontrada");
    return { id: data.id, obraId: data.obra_id };
  }

  async deleteTarefa(empresaId: string, id: string): Promise<void> {
    const { error } = await this.supabase.from("obras_tarefas").delete().eq("empresa_id", empresaId).eq("id", id);
    if (error) throw error;
  }

  async listDependencias(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("cronograma_dependencias")
      .select("id, tarefa_predecessora_id, tarefa_sucessora_id, tipo")
      .eq("empresa_id", empresaId);

    if (error) throw error;
    return data ?? [];
  }

  async createDependencia(empresaId: string, input: CreateDependenciaInput): Promise<void> {
    const { error } = await this.supabase.from("cronograma_dependencias").insert({
      empresa_id: empresaId,
      tarefa_predecessora_id: input.tarefaPredecessoraId,
      tarefa_sucessora_id: input.tarefaSucessoraId,
      tipo: input.tipo ?? "finish_to_start",
    });
    if (error) throw error;
  }

  async snapshotBaseline(empresaId: string, obraId: string, tarefas: any[], nextVersao: number): Promise<void> {
    const rows = tarefas.map((t) => ({
      empresa_id: empresaId,
      obra_id: obraId,
      tarefa_id: t.id,
      baseline_inicio: t.inicio,
      baseline_fim: t.fim,
      versao: nextVersao,
    }));

    const { error } = await this.supabase.from("cronograma_baselines").insert(rows);
    if (error) throw error;
  }

  async getLatestBaselines(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("cronograma_baselines")
      .select("tarefa_id, obra_id, baseline_inicio, baseline_fim, versao")
      .eq("empresa_id", empresaId);

    if (error) throw error;
    return data ?? [];
  }

  async listReplanejamentos(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("cronograma_replanejamentos")
      .select("id, obra_id, motivo, impacto_prazo_dias, impacto_custo, status, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  }

  async createReplanejamento(empresaId: string, input: CreateReplanejamentoInput): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("cronograma_replanejamentos")
      .insert({
        empresa_id: empresaId,
        obra_id: input.obraId,
        motivo: input.motivo,
        impacto_prazo_dias: input.impactoPrazoDias,
        impacto_custo: input.impactoCusto,
        status: input.status ?? "pendente",
      })
      .select("id")
      .single();

    if (error || !data?.id) throw new Error(error?.message ?? "Erro ao criar replanejamento");
    return data;
  }
}
