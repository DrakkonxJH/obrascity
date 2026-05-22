"use server";

import { revalidatePath } from "next/cache";
import { createFinanceiroItem } from "@/lib/db/financeiro";

export async function createFinanceiroAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const orcado = Number(formData.get("orcado") ?? 0);
  const realizado = Number(formData.get("realizado") ?? 0);

  if (!obra_id || !categoria) {
    throw new Error("Campos obrigatorios do financeiro ausentes");
  }

  await createFinanceiroItem({ obra_id, categoria, orcado, realizado });
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
}
