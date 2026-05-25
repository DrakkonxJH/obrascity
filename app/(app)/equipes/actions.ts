"use server";

import { revalidatePath } from "next/cache";
import { createEquipe } from "@/lib/db/equipes";
import { createEquipeAlocacao } from "@/lib/db/mobilizacao";

export async function createEquipeAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const especialidade = String(formData.get("especialidade") ?? "").trim();

  if (!nome) {
    throw new Error("Nome da equipe e obrigatorio");
  }

  await createEquipe({ nome, especialidade });
  revalidatePath("/equipes");
}

export async function createEquipeAlocacaoAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const equipeId = String(formData.get("equipe_id") ?? "").trim();
  const frente = String(formData.get("frente") ?? "").trim();
  const turno = String(formData.get("turno") ?? "diurno").trim();
  const dataInicio = String(formData.get("data_inicio") ?? "").trim();
  const dataFim = String(formData.get("data_fim") ?? "").trim();
  const capacidadePlanejada = Number(formData.get("capacidade_planejada") ?? 0);
  const alocados = Number(formData.get("alocados") ?? 0);
  const status = String(formData.get("status") ?? "planejada").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!obraId || !equipeId || !frente || !dataInicio || !dataFim) {
    throw new Error("Alocação exige obra, equipe, frente e período");
  }

  await createEquipeAlocacao({
    obraId,
    equipeId,
    frente,
    turno,
    dataInicio,
    dataFim,
    capacidadePlanejada,
    alocados,
    status,
    observacoes,
  });
  revalidatePath("/equipes");
}
