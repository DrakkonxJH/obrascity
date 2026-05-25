import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export type MobileSyncJobItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  status: string;
  direction: string;
  pendentes_criar: number;
  pendentes_atualizar: number;
  pendentes_deletar: number;
  conflitos: number;
  last_sync_at: string | null;
  created_at: string;
};

export type MobileSyncConflictItem = {
  id: string;
  sync_job_id: string;
  entidade: string;
  campo: string;
  valor_local: string;
  valor_remoto: string;
  resolucao: string;
  status: string;
  created_at: string;
};

export async function listMobileSyncJobs(): Promise<MobileSyncJobItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("mobile_sync_jobs")
    .select("id, obra_id, status, direction, pendentes_criar, pendentes_atualizar, pendentes_deletar, conflitos, last_sync_at, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Erro ao listar sincronizações mobile: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    status: String(row.status ?? "pendente"),
    direction: String(row.direction ?? "upload"),
    pendentes_criar: Number(row.pendentes_criar ?? 0),
    pendentes_atualizar: Number(row.pendentes_atualizar ?? 0),
    pendentes_deletar: Number(row.pendentes_deletar ?? 0),
    conflitos: Number(row.conflitos ?? 0),
    last_sync_at: row.last_sync_at ? String(row.last_sync_at) : null,
    created_at: String(row.created_at ?? ""),
  }));
}

export async function createMobileSyncJob(input: {
  obraId: string;
  direction: string;
  pendentesCriar: number;
  pendentesAtualizar: number;
  pendentesDeletar: number;
  conflitos: number;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  const supabase = await createServerClient();
  const { error } = await supabase.from("mobile_sync_jobs").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    profile_id: profile?.id ?? null,
    status: "processado",
    direction: input.direction,
    pendentes_criar: input.pendentesCriar,
    pendentes_atualizar: input.pendentesAtualizar,
    pendentes_deletar: input.pendentesDeletar,
    conflitos: input.conflitos,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Erro ao registrar sincronização mobile: ${error.message}`);
  }
}

export async function listMobileSyncConflicts(): Promise<MobileSyncConflictItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("mobile_sync_conflicts")
    .select("id, sync_job_id, entidade, campo, valor_local, valor_remoto, resolucao, status, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Erro ao listar conflitos mobile: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    sync_job_id: String(row.sync_job_id ?? ""),
    entidade: String(row.entidade ?? ""),
    campo: String(row.campo ?? ""),
    valor_local: String(row.valor_local ?? ""),
    valor_remoto: String(row.valor_remoto ?? ""),
    resolucao: String(row.resolucao ?? ""),
    status: String(row.status ?? "aberto"),
    created_at: String(row.created_at ?? ""),
  }));
}

export async function createMobileSyncConflict(input: {
  syncJobId: string;
  entidade: string;
  campo: string;
  valorLocal: string;
  valorRemoto: string;
  resolucao: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("mobile_sync_conflicts").insert({
    empresa_id: empresaId,
    sync_job_id: input.syncJobId,
    entidade: input.entidade,
    campo: input.campo,
    valor_local: input.valorLocal,
    valor_remoto: input.valorRemoto,
    resolucao: input.resolucao,
  });

  if (error) {
    throw new Error(`Erro ao registrar conflito mobile: ${error.message}`);
  }
}

export async function resolveMobileSyncConflict(conflictId: string, resolucao: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const profile = await getCurrentProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("mobile_sync_conflicts")
    .update({
      status: "resolvido",
      resolucao,
      resolvido_por: profile?.id ?? null,
      resolvido_em: new Date().toISOString(),
    })
    .eq("empresa_id", empresaId)
    .eq("id", conflictId);

  if (error) {
    throw new Error(`Erro ao resolver conflito mobile: ${error.message}`);
  }
}

