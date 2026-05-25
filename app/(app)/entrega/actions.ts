"use server";

import { revalidatePath } from "next/cache";
import { createComissionamento, upsertEntrega } from "@/lib/db/entrega";

export async function createComissionamentoAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const sistema = String(formData.get("sistema") ?? "").trim();
  const ambiente = String(formData.get("ambiente") ?? "").trim();
  const item = String(formData.get("item") ?? "").trim();
  const status = String(formData.get("status") ?? "pendente").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!obraId || !sistema || !ambiente || !item) {
    throw new Error("Comissionamento exige obra, sistema, ambiente e item");
  }

  await createComissionamento({
    obraId,
    sistema,
    ambiente,
    item,
    status,
    observacao,
  });
  revalidatePath("/entrega");
}

export async function saveEntregaAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const status = String(formData.get("status") ?? "preparacao").trim();
  const chavesEntregues = String(formData.get("chaves_entregues") ?? "") === "on";
  const dataEntregaRaw = String(formData.get("data_entrega") ?? "").trim();
  const aceiteClienteNome = String(formData.get("aceite_cliente_nome") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!obraId) {
    throw new Error("Obra obrigatória para registro de entrega");
  }

  await upsertEntrega({
    obraId,
    status,
    chavesEntregues,
    dataEntrega: dataEntregaRaw ? new Date(dataEntregaRaw).toISOString() : null,
    aceiteClienteNome,
    observacoes,
  });
  revalidatePath("/entrega");
}

