"use server";

import { revalidatePath } from "next/cache";
import { createDiario, uploadDiarioEvidencias } from "@/lib/db/diario";

export async function createDiarioAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const data_ref = String(formData.get("data_ref") ?? "").trim();
  const clima = String(formData.get("clima") ?? "").trim();
  const efetivo = Number(formData.get("efetivo") ?? 0);
  const equipamentos = String(formData.get("equipamentos") ?? "").trim();
  const ocorrencias = String(formData.get("ocorrencias") ?? "").trim();
  const observacoes_ssma = String(formData.get("observacoes_ssma") ?? "").trim();
  const assinatura_url = String(formData.get("assinatura_url") ?? "").trim();
  const descricao_evidencias = String(formData.get("descricao_evidencias") ?? "").trim();
  const evidencias = formData.getAll("evidencias").filter((item): item is File => item instanceof File && item.size > 0);

  if (!obra_id || !data_ref) {
    throw new Error("Obra e data do diario sao obrigatorias");
  }
  if (!Number.isFinite(efetivo) || efetivo < 0) {
    throw new Error("Efetivo do diário deve ser um número maior ou igual a zero");
  }

  const diarioId = await createDiario({
    obra_id,
    data_ref,
    clima,
    efetivo,
    equipamentos,
    ocorrencias,
    observacoes_ssma,
    assinatura_url,
  });
  await uploadDiarioEvidencias({
    diarioId,
    obraId: obra_id,
    files: evidencias,
    descricao: descricao_evidencias || null,
  });

  revalidatePath("/diario");
}
