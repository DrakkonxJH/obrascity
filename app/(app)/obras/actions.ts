"use server";

import { revalidatePath } from "next/cache";
import { createObra, restoreObra, softDeleteObra } from "@/lib/db/obras";
import { getCurrentUser } from "@/lib/auth/session";

export async function createObraAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cliente = String(formData.get("cliente") ?? "").trim();
  const status = String(formData.get("status") ?? "planejamento").trim();

  if (!nome) {
    throw new Error("Nome da obra e obrigatorio");
  }

  if (!cliente) {
    throw new Error("Cliente da obra e obrigatorio");
  }

  await createObra({
    nome,
    cliente,
    status: status as "planejamento" | "andamento" | "atencao" | "concluida",
  });

  revalidatePath("/obras");
  revalidatePath("/dashboard");
}

export async function deleteObraAction(obraId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  await softDeleteObra(obraId, user.id);

  revalidatePath("/obras");
  revalidatePath("/dashboard");
  revalidatePath(`/obras/${obraId}`);
}

export async function restoreObraAction(obraId: string) {
  await restoreObra(obraId);

  revalidatePath("/obras");
  revalidatePath("/dashboard");
  revalidatePath(`/obras/${obraId}`);
}
