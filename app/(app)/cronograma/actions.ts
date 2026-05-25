"use server";

import { revalidatePath } from "next/cache";
import { createCronogramaItem, createDependenciaCronograma, createReplanejamento, snapshotBaseline } from "@/lib/db/cronograma";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";

export async function createCronogramaAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const inicio = String(formData.get("inicio") ?? "").trim();
  const fim = String(formData.get("fim") ?? "").trim();
  const status = String(formData.get("status") ?? "planejado").trim();

  if (!obra_id || !nome || !inicio || !fim) {
    throw new Error("Campos obrigatorios do cronograma ausentes");
  }

  await createCronogramaItem({ obra_id, nome, inicio, fim, status });
  revalidatePath("/cronograma");
}

export async function createDependenciaAction(formData: FormData) {
  const tarefa_predecessora_id = String(formData.get("tarefa_predecessora_id") ?? "").trim();
  const tarefa_sucessora_id = String(formData.get("tarefa_sucessora_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "finish_to_start").trim();

  if (!tarefa_predecessora_id || !tarefa_sucessora_id) {
    throw new Error("Dependencia requer predecessor e sucessor");
  }

  await createDependenciaCronograma({ tarefa_predecessora_id, tarefa_sucessora_id, tipo });
  revalidatePath("/cronograma");
}

export async function gerarBaselineAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  if (!obra_id) {
    throw new Error("Obra obrigatoria para baseline");
  }

  await snapshotBaseline(obra_id);
  revalidatePath("/cronograma");
}

export async function createReplanejamentoAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  const impacto_prazo_dias = Number(formData.get("impacto_prazo_dias") ?? 0);
  const impacto_custo = Number(formData.get("impacto_custo") ?? 0);

  if (!obra_id || !motivo) {
    throw new Error("Replanejamento exige obra e motivo");
  }

  const profile = await getCurrentProfile();
  if (!profile?.id || !isProfileRole(String(profile.role ?? ""))) {
    throw new Error("Perfil inválido para replanejamento");
  }

  const requiresApproval = requiresApprovalForAmount(profile.role, impacto_custo);
  const replanejamentoId = await createReplanejamento({
    obra_id,
    motivo,
    impacto_prazo_dias,
    impacto_custo,
    status: requiresApproval ? "em_aprovacao" : "aprovado",
  });

  if (requiresApproval) {
    await createApprovalRequest({
      entityType: "cronograma_change",
      entityId: replanejamentoId,
      entityRef: motivo,
      amount: impacto_custo,
      requesterRole: profile.role,
      requiredRole: resolveRequiredRoleByAmount(impacto_custo),
      notes: "Replanejamento com impacto financeiro exige aprovação.",
      metadata: { obraId: obra_id, impactoPrazoDias: impacto_prazo_dias },
    });
  }

  revalidatePath("/cronograma");
  revalidatePath("/governanca");
}
