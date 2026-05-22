"use server";

import { revalidatePath } from "next/cache";
import { createMembro } from "@/lib/db/equipes";

export async function createMembroAction(formData: FormData) {
  const cargo = String(formData.get("cargo") ?? "").trim();
  const crea = String(formData.get("crea") ?? "").trim();
  const equipeId = String(formData.get("equipe_id") ?? "").trim();

  if (!cargo) {
    throw new Error("Cargo e obrigatorio");
  }

  await createMembro({
    cargo,
    crea: crea || undefined,
    equipe_id: equipeId || undefined,
  });

  revalidatePath("/equipes");
}
