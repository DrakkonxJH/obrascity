"use server";

import { revalidatePath } from "next/cache";
import { createProjetoConflito, createProjetoDocumento } from "@/lib/db/projetos";

export async function createProjetoDocumentoAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const disciplina = String(formData.get("disciplina") ?? "").trim();
  const revisao = String(formData.get("revisao") ?? "").trim();
  const status = String(formData.get("status") ?? "em_revisao").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!obraId || !disciplina || !revisao) {
    throw new Error("Documento de projeto exige obra, disciplina e revisão");
  }

  await createProjetoDocumento({ obraId, disciplina, revisao, status, observacoes });
  revalidatePath("/projetos");
}

export async function createProjetoConflitoAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const severidade = String(formData.get("severidade") ?? "media").trim();
  const prazoRaw = String(formData.get("prazo") ?? "").trim();

  if (!obraId || !titulo || !descricao) {
    throw new Error("Conflito exige obra, título e descrição");
  }

  await createProjetoConflito({
    obraId,
    titulo,
    descricao,
    severidade,
    prazo: prazoRaw || null,
  });
  revalidatePath("/projetos");
}

