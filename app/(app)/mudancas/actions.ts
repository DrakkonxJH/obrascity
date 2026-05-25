"use server";

import { revalidatePath } from "next/cache";
import { createMudanca } from "@/lib/db/mudancas";

export async function createMudancaAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "escopo").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const impactoPrazoDias = Number(formData.get("impacto_prazo_dias") ?? 0);
  const impactoCusto = Number(formData.get("impacto_custo") ?? 0);

  if (!obraId || !titulo || !descricao) {
    throw new Error("Mudança exige obra, título e descrição");
  }

  await createMudanca({
    obraId,
    tipo,
    titulo,
    descricao,
    impactoPrazoDias,
    impactoCusto,
  });

  revalidatePath("/mudancas");
  revalidatePath("/governanca");
}

