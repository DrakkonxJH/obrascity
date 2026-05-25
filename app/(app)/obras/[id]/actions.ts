"use server";

import { revalidatePath } from "next/cache";
import { createFinanceiroItem, updateFinanceiroItem } from "@/lib/db/financeiro";
import { updateObra } from "@/lib/db/obras";
import type { ObraStatus } from "@/types/domain";

const VALID_STATUS = new Set<ObraStatus>(["planejamento", "andamento", "atencao", "concluida"]);

function parseCurrencyField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "0").replace(",", ".").trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Valor inválido para ${key}`);
  }
  return value;
}

function refreshObraPages(obraId: string) {
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/obras");
  revalidatePath("/financeiro");
  revalidatePath("/cronograma");
  revalidatePath("/materiais");
  revalidatePath("/diario");
  revalidatePath("/relatorios");
  revalidatePath("/dashboard");
}

export async function updateObraDetalhesAction(obraId: string, formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cliente = String(formData.get("cliente") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ObraStatus;
  const progresso = Number(formData.get("progresso") ?? 0);

  if (!nome) throw new Error("Nome da obra é obrigatório");
  if (!cliente) throw new Error("Cliente da obra é obrigatório");
  if (!VALID_STATUS.has(status)) throw new Error("Status da obra inválido");
  if (!Number.isFinite(progresso) || progresso < 0 || progresso > 100) {
    throw new Error("Progresso deve estar entre 0 e 100");
  }

  await updateObra(obraId, { nome, cliente, status, progresso: Math.round(progresso) });
  refreshObraPages(obraId);
}

export async function addObraFinanceiroItemAction(obraId: string, formData: FormData) {
  const categoria = String(formData.get("categoria") ?? "").trim();
  if (!categoria) throw new Error("Categoria é obrigatória");

  await createFinanceiroItem({
    obra_id: obraId,
    categoria,
    orcado: parseCurrencyField(formData, "orcado"),
    realizado: parseCurrencyField(formData, "realizado"),
  });
  refreshObraPages(obraId);
}

export async function updateObraFinanceiroItemAction(
  obraId: string,
  financeiroId: string,
  formData: FormData,
) {
  const categoria = String(formData.get("categoria") ?? "").trim();
  if (!categoria) throw new Error("Categoria é obrigatória");

  await updateFinanceiroItem({
    id: financeiroId,
    obra_id: obraId,
    categoria,
    orcado: parseCurrencyField(formData, "orcado"),
    realizado: parseCurrencyField(formData, "realizado"),
  });
  refreshObraPages(obraId);
}
