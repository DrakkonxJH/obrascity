"use server";

import { revalidatePath } from "next/cache";
import { createMudanca } from "@/lib/db/mudancas";
import { approveRequest, rejectRequest } from "@/lib/db/approvals";

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

export async function approveMudancaRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approval_id") ?? "").trim();
  if (!approvalId) {
    throw new Error("Solicitação inválida para aprovação.");
  }

  await approveRequest({
    approvalId,
    note: "Aprovado pelo módulo de mudanças.",
  });

  revalidatePath("/mudancas");
  revalidatePath("/governanca");
  revalidatePath("/cronograma");
  revalidatePath("/relatorios/mudancas");
}

export async function rejectMudancaRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approval_id") ?? "").trim();
  if (!approvalId) {
    throw new Error("Solicitação inválida para rejeição.");
  }

  await rejectRequest({
    approvalId,
    note: "Rejeitado pelo módulo de mudanças.",
  });

  revalidatePath("/mudancas");
  revalidatePath("/governanca");
  revalidatePath("/cronograma");
  revalidatePath("/relatorios/mudancas");
}
