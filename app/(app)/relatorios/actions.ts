"use server";

import { revalidatePath } from "next/cache";
import { getQueue, QueueNames } from "@/lib/queue/connection";
import { createRelatórioRequest } from "@/lib/db/relatorios";

export async function solicitarRelatórioAction(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "progresso").trim();
  const formato = String(formData.get("formato") ?? "pdf").trim() || "pdf";
  const obraValue = String(formData.get("obra_id") ?? "").trim();
  const obra_id = obraValue.length > 0 ? obraValue : null;

  const relatórioId = await createRelatórioRequest({ obra_id, tipo, formato });

  const queue = getQueue(QueueNames.REPORTS_GENERATE);
  await queue.add(
    "generate-report",
      {
        relatórioId,
        obraId: obra_id,
        tipo,
        formato,
        requestedAt: new Date().toISOString(),
      },
    {
      jobId: `report:${relatórioId}`,
    },
  );

  revalidatePath("/relatórios");
}
