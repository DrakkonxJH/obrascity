"use server";

import { revalidatePath } from "next/cache";
import { createEquipe } from "@/lib/db/equipes";

export async function createEquipeAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const especialidade = String(formData.get("especialidade") ?? "").trim();

  if (!nome) {
    throw new Error("Nome da equipe e obrigatorio");
  }

  await createEquipe({ nome, especialidade });
  revalidatePath("/equipes");
}
