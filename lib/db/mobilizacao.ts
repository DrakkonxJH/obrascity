import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export type EquipeAlocacaoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  equipe_id: string;
  equipe_nome: string;
  frente: string;
  turno: string;
  data_inicio: string;
  data_fim: string;
  capacidade_planejada: number;
  alocados: number;
  status: string;
};

export type EquipeCapacidadeItem = {
  equipe_id: string;
  equipe_nome: string;
  capacidade_total: number;
  alocados_total: number;
  conflito: boolean;
};

export async function listEquipeAlocacoes(): Promise<EquipeAlocacaoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("equipe_alocacoes")
    .select("id, obra_id, equipe_id, frente, turno, data_inicio, data_fim, capacidade_planejada, alocados, status, obras(nome), equipes(nome)")
    .eq("empresa_id", empresaId)
    .order("data_inicio", { ascending: false })
    .limit(300);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    equipe_id: String(row.equipe_id ?? ""),
    equipe_nome: ((row.equipes as { nome?: string } | null)?.nome ?? "Equipe") as string,
    frente: String(row.frente ?? ""),
    turno: String(row.turno ?? "diurno"),
    data_inicio: String(row.data_inicio ?? ""),
    data_fim: String(row.data_fim ?? ""),
    capacidade_planejada: Number(row.capacidade_planejada ?? 0),
    alocados: Number(row.alocados ?? 0),
    status: String(row.status ?? "planejada"),
  }));
}

export async function createEquipeAlocacao(input: {
  obraId: string;
  equipeId: string;
  frente: string;
  turno: string;
  dataInicio: string;
  dataFim: string;
  capacidadePlanejada: number;
  alocados: number;
  status: string;
  observacoes: string;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  const supabase = await createServerClient();
  const { error } = await supabase.from("equipe_alocacoes").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    equipe_id: input.equipeId,
    frente: input.frente,
    turno: input.turno,
    data_inicio: input.dataInicio,
    data_fim: input.dataFim,
    capacidade_planejada: input.capacidadePlanejada,
    alocados: input.alocados,
    status: input.status,
    observacoes: input.observacoes,
    created_by: profile?.id ?? null,
  });

  if (error) {
    throw new Error(`Erro ao criar alocação de equipe: ${error.message}`);
  }
}

export async function listEquipeCapacidade(): Promise<EquipeCapacidadeItem[]> {
  const [empresaId, supabase] = await Promise.all([getEmpresaIdFromProfile(), createServerClient()]);
  const [equipes, alocacoes] = await Promise.all([
    supabase.from("equipes").select("id, nome").eq("empresa_id", empresaId),
    supabase
      .from("equipe_alocacoes")
      .select("equipe_id, capacidade_planejada, alocados")
      .eq("empresa_id", empresaId),
  ]);

  if (equipes.error) {
    return [];
  }
  if (alocacoes.error) {
    return [];
  }

  const capacidade = new Map<string, { capacidade: number; alocados: number }>();
  for (const row of (alocacoes.data ?? []) as Array<Record<string, unknown>>) {
    const equipeId = String(row.equipe_id ?? "");
    if (!equipeId) continue;
    const current = capacidade.get(equipeId) ?? { capacidade: 0, alocados: 0 };
    current.capacidade += Number(row.capacidade_planejada ?? 0);
    current.alocados += Number(row.alocados ?? 0);
    capacidade.set(equipeId, current);
  }

  return ((equipes.data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const equipeId = String(row.id ?? "");
    const resume = capacidade.get(equipeId) ?? { capacidade: 0, alocados: 0 };
    return {
      equipe_id: equipeId,
      equipe_nome: String(row.nome ?? "Equipe"),
      capacidade_total: resume.capacidade,
      alocados_total: resume.alocados,
      conflito: resume.alocados > resume.capacidade,
    };
  });
}

