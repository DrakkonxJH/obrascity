import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";

export type CronogramaItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  nome: string;
  inicio: string;
  fim: string;
  status: string;
};

export type CronogramaDependencia = {
  id: string;
  tarefa_predecessora_id: string;
  tarefa_sucessora_id: string;
  tipo: string;
};

export async function listCronograma(): Promise<CronogramaItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const { data, error } = await supabase
    .from("obras_tarefas")
    .select("id, obra_id, nome, inicio, fim, status, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("inicio", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar cronograma: ${error.message}`);
  }

  return (data ?? [])
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra sem nome",
    nome: item.nome as string,
    inicio: item.inicio as string,
    fim: item.fim as string,
    status: item.status as string,
  }));
}

export async function createCronogramaItem(input: {
  obra_id: string;
  nome: string;
  inicio: string;
  fim: string;
  status?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);

  const { error } = await supabase.from("obras_tarefas").insert({
    empresa_id: empresaId,
    obra_id: input.obra_id,
    nome: input.nome,
    inicio: input.inicio,
    fim: input.fim,
    status: input.status ?? "planejado",
  });

  if (error) {
    throw new Error(`Erro ao criar tarefa: ${error.message}`);
  }
}

export async function listDependenciasCronograma(): Promise<CronogramaDependencia[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cronograma_dependencias")
    .select("id, tarefa_predecessora_id, tarefa_sucessora_id, tipo")
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(`Erro ao listar dependencias: ${error.message}`);
  }

  return (data ?? []) as CronogramaDependencia[];
}

export async function createDependenciaCronograma(input: {
  tarefa_predecessora_id: string;
  tarefa_sucessora_id: string;
  tipo?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("cronograma_dependencias").insert({
    empresa_id: empresaId,
    tarefa_predecessora_id: input.tarefa_predecessora_id,
    tarefa_sucessora_id: input.tarefa_sucessora_id,
    tipo: input.tipo ?? "finish_to_start",
  });

  if (error) {
    throw new Error(`Erro ao criar dependencia: ${error.message}`);
  }
}

export async function snapshotBaseline(obraId: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(obraId);

  const { data: tarefas, error: tarefasError } = await supabase
    .from("obras_tarefas")
    .select("id, inicio, fim")
    .eq("empresa_id", empresaId)
    .eq("obra_id", obraId);

  if (tarefasError) {
    throw new Error(`Erro ao carregar tarefas para baseline: ${tarefasError.message}`);
  }

  const { data: versoes, error: versoesError } = await supabase
    .from("cronograma_baselines")
    .select("versao")
    .eq("empresa_id", empresaId)
    .eq("obra_id", obraId)
    .order("versao", { ascending: false })
    .limit(1);

  if (versoesError) {
    throw new Error(`Erro ao buscar versao baseline: ${versoesError.message}`);
  }

  const nextVersao = (versoes?.[0]?.versao ?? 0) + 1;

  const rows = (tarefas ?? []).map((tarefa) => ({
    empresa_id: empresaId,
    obra_id: obraId,
    tarefa_id: tarefa.id,
    baseline_inicio: tarefa.inicio,
    baseline_fim: tarefa.fim,
    versao: nextVersao,
  }));

  if (!rows.length) return;

  const { error: insertError } = await supabase.from("cronograma_baselines").insert(rows);
  if (insertError) {
    throw new Error(`Erro ao gerar baseline: ${insertError.message}`);
  }
}
