import { SupabaseClient } from "@supabase/supabase-js";
import {
  ProjetoDocumento,
  ProjetoConflito,
  CreateProjetoDocumentoInput,
  CreateProjetoConflitoInput
} from "./entities";

export interface IProjectRepository {
  listDocumentos(empresaId: string): Promise<ProjetoDocumento[]>;
  createDocumento(empresaId: string, userId: string | null, input: CreateProjetoDocumentoInput): Promise<void>;
  listConflitos(empresaId: string): Promise<ProjetoConflito[]>;
  createConflito(empresaId: string, input: CreateProjetoConflitoInput): Promise<void>;
}

export class SupabaseProjectRepository implements IProjectRepository {
  constructor(private supabase: SupabaseClient) {}

  async listDocumentos(empresaId: string): Promise<ProjetoDocumento[]> {
    const { data, error } = await this.supabase
      .from("projetos_documentos")
      .select("id, obra_id, disciplina, revisao, status, observacoes, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    return ((data ?? []) as Array<any>).map((item) => ({
      id: String(item.id ?? ""),
      obraId: String(item.obra_id ?? ""),
      obraNome: ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
      disciplina: String(item.disciplina ?? ""),
      revisao: String(item.revisao ?? ""),
      status: String(item.status ?? "em_revisao"),
      observacoes: String(item.observacoes ?? ""),
      createdAt: String(item.created_at ?? ""),
    }));
  }

  async createDocumento(empresaId: string, userId: string | null, input: CreateProjetoDocumentoInput): Promise<void> {
    const { error } = await this.supabase.from("projetos_documentos").insert({
      empresa_id: empresaId,
      obra_id: input.obraId,
      disciplina: input.disciplina,
      revisao: input.revisao,
      status: input.status,
      observacoes: input.observacoes,
      created_by: userId,
    });

    if (error) throw error;
  }

  async listConflitos(empresaId: string): Promise<ProjetoConflito[]> {
    const { data, error } = await this.supabase
      .from("projetos_conflitos")
      .select("id, obra_id, titulo, descricao, severidade, status, prazo, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    return ((data ?? []) as Array<any>).map((item) => ({
      id: String(item.id ?? ""),
      obraId: String(item.obra_id ?? ""),
      obraNome: ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
      titulo: String(item.titulo ?? ""),
      descricao: String(item.descricao ?? ""),
      severidade: String(item.severidade ?? "media"),
      status: String(item.status ?? "aberto"),
      prazo: item.prazo ? String(item.prazo) : null,
      createdAt: String(item.created_at ?? ""),
    }));
  }

  async createConflito(empresaId: string, input: CreateProjetoConflitoInput): Promise<void> {
    const { error } = await this.supabase.from("projetos_conflitos").insert({
      empresa_id: empresaId,
      obra_id: input.obraId,
      titulo: input.titulo,
      descricao: input.descricao,
      severidade: input.severidade,
      prazo: input.prazo,
    });

    if (error) throw error;
  }
}
