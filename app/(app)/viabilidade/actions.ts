"use server";

import { revalidatePath } from "next/cache";
import { upsertViabilidade } from "@/lib/db/viabilidade";

export async function saveViabilidadeAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const statusTecnico = String(formData.get("status_tecnico") ?? "pendente").trim();
  const statusLegal = String(formData.get("status_legal") ?? "pendente").trim();
  const statusEconomico = String(formData.get("status_economico") ?? "pendente").trim();
  const goNoGo = String(formData.get("go_no_go") ?? "pendente").trim();
  const parecer = String(formData.get("parecer") ?? "").trim();

  if (!obraId) {
    throw new Error("Obra obrigatória para viabilidade");
  }

  await upsertViabilidade({
    obraId,
    statusTecnico,
    statusLegal,
    statusEconomico,
    goNoGo,
    parecer,
  });

  revalidatePath("/viabilidade");
}

