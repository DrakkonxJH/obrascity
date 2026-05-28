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

export type ReplanejamentoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  motivo: string;
  impacto_prazo_dias: number;
  impacto_custo: number;
  status: string;
  created_at: string;
};

export type CaminhoCriticoItem = {
  tarefa_id: string;
  obra_id: string;
  obra_nome: string;
  nome: string;
  inicio: string;
  fim: string;
  duracao_dias: number;
  dependencias: number;
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
    return [];
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

  const { data, error } = await supabase
    .from("obras_tarefas")
    .insert({
      empresa_id: empresaId,
      obra_id: input.obra_id,
      nome: input.nome,
      inicio: input.inicio,
      fim: input.fim,
      status: input.status ?? "planejado",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data?.id) {
    throw new Error(`Erro ao criar tarefa: ${error?.message ?? "falha desconhecida"}`);
  }
  return data.id;
}

export async function updateCronogramaItem(input: {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  status: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
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
    .single<{ id: string; obra_id: string }>();

  if (error || !data?.id) {
    throw new Error(`Erro ao atualizar tarefa: ${error?.message ?? "tarefa não encontrada"}`);
  }
  return data;
}

export async function deleteCronogramaItem(id: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("obras_tarefas").delete().eq("empresa_id", empresaId).eq("id", id);

  if (error) {
    throw new Error(`Erro ao remover tarefa: ${error.message}`);
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
    return [];
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

export async function listReplanejamentos(): Promise<ReplanejamentoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cronograma_replanejamentos")
    .select("id, obra_id, motivo, impacto_prazo_dias, impacto_custo, status, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    obra_id: String(item.obra_id ?? ""),
    obra_nome: ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    motivo: String(item.motivo ?? ""),
    impacto_prazo_dias: Number(item.impacto_prazo_dias ?? 0),
    impacto_custo: Number(item.impacto_custo ?? 0),
    status: String(item.status ?? "pendente"),
    created_at: String(item.created_at ?? ""),
  }));
}

export async function createReplanejamento(input: {
  obra_id: string;
  motivo: string;
  impacto_prazo_dias: number;
  impacto_custo: number;
  status?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const { data, error } = await supabase
    .from("cronograma_replanejamentos")
    .insert({
      empresa_id: empresaId,
      obra_id: input.obra_id,
      motivo: input.motivo,
      impacto_prazo_dias: input.impacto_prazo_dias,
      impacto_custo: input.impacto_custo,
      status: input.status ?? "pendente",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Erro ao registrar replanejamento: ${error?.message ?? "sem id retornado"}`);
  }
  return String(data.id);
}

export async function listCaminhoCritico(): Promise<CaminhoCriticoItem[]> {
  const [items, dependencias] = await Promise.all([listCronograma(), listDependenciasCronograma()]);
  const dependenciaBySucessora = new Map<string, number>();
  for (const dep of dependencias) {
    dependenciaBySucessora.set(
      dep.tarefa_sucessora_id,
      (dependenciaBySucessora.get(dep.tarefa_sucessora_id) ?? 0) + 1,
    );
  }

  return items
    .map((item) => {
      const inicioTime = new Date(item.inicio).getTime();
      const fimTime = new Date(item.fim).getTime();
      const duracao = Math.max(1, Math.ceil((fimTime - inicioTime) / 86_400_000));
      return {
        tarefa_id: item.id,
        obra_id: item.obra_id,
        obra_nome: item.obra_nome,
        nome: item.nome,
        inicio: item.inicio,
        fim: item.fim,
        duracao_dias: duracao,
        dependencias: dependenciaBySucessora.get(item.id) ?? 0,
      };
    })
    .sort((a, b) => b.duracao_dias - a.duracao_dias || b.dependencias - a.dependencias)
    .slice(0, 15);
}
