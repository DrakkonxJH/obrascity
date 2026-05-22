"use server";

import { revalidatePath } from "next/cache";
import { createMedicao } from "@/lib/db/medicoes";

export async function createMedicaoAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const referencia = String(formData.get("referencia") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const retencao = Number(formData.get("retencao") ?? 0);
  const aditivo = Number(formData.get("aditivo") ?? 0);
  const status = String(formData.get("status") ?? "rascunho").trim();

  if (!obra_id || !referencia) {
    throw new Error("Campos obrigatorios da medicao ausentes");
  }

  await createMedicao({
    obra_id,
    referencia,
    valor,
    retencao,
    aditivo,
    status,
  });

  revalidatePath("/financeiro");
}
