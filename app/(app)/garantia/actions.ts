"use server";

import { revalidatePath } from "next/cache";
import {
  createGarantiaChamado,
  createGarantiaInteracao,
  updateGarantiaStatus,
} from "@/lib/db/garantia";

export async function createGarantiaChamadoAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const unidade = String(formData.get("unidade") ?? "").trim();
  const sistema = String(formData.get("sistema") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const criticidade = String(formData.get("criticidade") ?? "media").trim();
  const slaHoras = Number(formData.get("sla_horas") ?? 24);

  if (!obraId || !sistema || !titulo || !descricao) {
    throw new Error("Chamado de garantia exige obra, sistema, título e descrição");
  }

  await createGarantiaChamado({
    obraId,
    unidade,
    sistema,
    titulo,
    descricao,
    criticidade,
    slaHoras,
  });

  revalidatePath("/garantia");
}

export async function updateGarantiaStatusAction(formData: FormData) {
  const chamadoId = String(formData.get("chamado_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!chamadoId || !status) {
    throw new Error("Atualização de garantia exige chamado e status");
  }

  await updateGarantiaStatus(chamadoId, status);
  revalidatePath("/garantia");
}

export async function createGarantiaInteracaoAction(formData: FormData) {
  const chamadoId = String(formData.get("chamado_id") ?? "").trim();
  const mensagem = String(formData.get("mensagem") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "comentario").trim();

  if (!chamadoId || !mensagem) {
    throw new Error("Interação de garantia exige chamado e mensagem");
  }

  await createGarantiaInteracao({
    chamadoId,
    mensagem,
    tipo,
  });

  revalidatePath("/garantia");
}

