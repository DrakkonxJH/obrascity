import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export type ProjetoDocumentoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  disciplina: string;
  revisao: string;
  status: string;
  observacoes: string;
  created_at: string;
};

export type ProjetoConflitoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  titulo: string;
  descricao: string;
  severidade: string;
  status: string;
  prazo: string | null;
  created_at: string;
};

export async function listProjetosDocumentos(): Promise<ProjetoDocumentoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("projetos_documentos")
    .select("id, obra_id, disciplina, revisao, status, observacoes, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    obra_id: String(item.obra_id ?? ""),
    obra_nome: ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    disciplina: String(item.disciplina ?? ""),
    revisao: String(item.revisao ?? ""),
    status: String(item.status ?? "em_revisao"),
    observacoes: String(item.observacoes ?? ""),
    created_at: String(item.created_at ?? ""),
  }));
}

export async function createProjetoDocumento(input: {
  obraId: string;
  disciplina: string;
  revisao: string;
  status: string;
  observacoes: string;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  const supabase = await createServerClient();
  const { error } = await supabase.from("projetos_documentos").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    disciplina: input.disciplina,
    revisao: input.revisao,
    status: input.status,
    observacoes: input.observacoes,
    created_by: profile?.id ?? null,
  });

  if (error) {
    throw new Error(`Erro ao criar documento de projeto: ${error.message}`);
  }
}

export async function listProjetosConflitos(): Promise<ProjetoConflitoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("projetos_conflitos")
    .select("id, obra_id, titulo, descricao, severidade, status, prazo, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    obra_id: String(item.obra_id ?? ""),
    obra_nome: ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    titulo: String(item.titulo ?? ""),
    descricao: String(item.descricao ?? ""),
    severidade: String(item.severidade ?? "media"),
    status: String(item.status ?? "aberto"),
    prazo: item.prazo ? String(item.prazo) : null,
    created_at: String(item.created_at ?? ""),
  }));
}

export async function createProjetoConflito(input: {
  obraId: string;
  titulo: string;
  descricao: string;
  severidade: string;
  prazo: string | null;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("projetos_conflitos").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    titulo: input.titulo,
    descricao: input.descricao,
    severidade: input.severidade,
    prazo: input.prazo,
  });

  if (error) {
    throw new Error(`Erro ao criar conflito de projeto: ${error.message}`);
  }
}

