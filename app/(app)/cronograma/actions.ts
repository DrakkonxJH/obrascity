"use server";

import { revalidatePath } from "next/cache";
import { createCronogramaItem, createDependenciaCronograma, snapshotBaseline } from "@/lib/db/cronograma";

export async function createCronogramaAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const inicio = String(formData.get("inicio") ?? "").trim();
  const fim = String(formData.get("fim") ?? "").trim();
  const status = String(formData.get("status") ?? "planejado").trim();

  if (!obra_id || !nome || !inicio || !fim) {
    throw new Error("Campos obrigatorios do cronograma ausentes");
  }

  await createCronogramaItem({ obra_id, nome, inicio, fim, status });
  revalidatePath("/cronograma");
}

export async function createDependenciaAction(formData: FormData) {
  const tarefa_predecessora_id = String(formData.get("tarefa_predecessora_id") ?? "").trim();
  const tarefa_sucessora_id = String(formData.get("tarefa_sucessora_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "finish_to_start").trim();

  if (!tarefa_predecessora_id || !tarefa_sucessora_id) {
    throw new Error("Dependencia requer predecessor e sucessor");
  }

  await createDependenciaCronograma({ tarefa_predecessora_id, tarefa_sucessora_id, tipo });
  revalidatePath("/cronograma");
}

export async function gerarBaselineAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  if (!obra_id) {
    throw new Error("Obra obrigatoria para baseline");
  }

  await snapshotBaseline(obra_id);
  revalidatePath("/cronograma");
}
