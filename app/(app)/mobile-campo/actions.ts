"use server";

import { revalidatePath } from "next/cache";
import {
  createMobileSyncConflict,
  createMobileSyncJob,
  resolveMobileSyncConflict,
} from "@/lib/db/mobile-campo";

export async function createMobileSyncJobAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "upload").trim();
  const pendentesCriar = Number(formData.get("pendentes_criar") ?? 0);
  const pendentesAtualizar = Number(formData.get("pendentes_atualizar") ?? 0);
  const pendentesDeletar = Number(formData.get("pendentes_deletar") ?? 0);
  const conflitos = Number(formData.get("conflitos") ?? 0);

  if (!obraId) {
    throw new Error("Obra obrigatória para sincronização");
  }

  await createMobileSyncJob({
    obraId,
    direction,
    pendentesCriar,
    pendentesAtualizar,
    pendentesDeletar,
    conflitos,
  });

  revalidatePath("/mobile-campo");
}

export async function createMobileSyncConflictAction(formData: FormData) {
  const syncJobId = String(formData.get("sync_job_id") ?? "").trim();
  const entidade = String(formData.get("entidade") ?? "").trim();
  const campo = String(formData.get("campo") ?? "").trim();
  const valorLocal = String(formData.get("valor_local") ?? "").trim();
  const valorRemoto = String(formData.get("valor_remoto") ?? "").trim();
  const resolucao = String(formData.get("resolucao") ?? "").trim();

  if (!syncJobId || !entidade || !campo) {
    throw new Error("Conflito mobile exige sincronização, entidade e campo");
  }

  await createMobileSyncConflict({
    syncJobId,
    entidade,
    campo,
    valorLocal,
    valorRemoto,
    resolucao,
  });
  revalidatePath("/mobile-campo");
}

export async function resolveMobileSyncConflictAction(formData: FormData) {
  const conflictId = String(formData.get("conflict_id") ?? "").trim();
  const resolucao = String(formData.get("resolucao") ?? "").trim();
  if (!conflictId || !resolucao) {
    throw new Error("Resolução exige conflito e decisão");
  }

  await resolveMobileSyncConflict(conflictId, resolucao);
  revalidatePath("/mobile-campo");
}

