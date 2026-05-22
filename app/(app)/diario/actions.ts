"use server";

import { revalidatePath } from "next/cache";
import { createDiario } from "@/lib/db/diario";

export async function createDiarioAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const data_ref = String(formData.get("data_ref") ?? "").trim();
  const clima = String(formData.get("clima") ?? "").trim();
  const efetivo = Number(formData.get("efetivo") ?? 0);
  const equipamentos = String(formData.get("equipamentos") ?? "").trim();
  const ocorrencias = String(formData.get("ocorrencias") ?? "").trim();
  const observacoes_ssma = String(formData.get("observacoes_ssma") ?? "").trim();
  const assinatura_url = String(formData.get("assinatura_url") ?? "").trim();

  if (!obra_id || !data_ref) {
    throw new Error("Obra e data do diario sao obrigatorias");
  }

  await createDiario({
    obra_id,
    data_ref,
    clima,
    efetivo,
    equipamentos,
    ocorrencias,
    observacoes_ssma,
    assinatura_url,
  });

  revalidatePath("/diario");
}
