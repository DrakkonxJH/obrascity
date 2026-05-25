"use server";

import { revalidatePath } from "next/cache";
import { createMedicao } from "@/lib/db/medicoes";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";

export async function createMedicaoAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const referencia = String(formData.get("referencia") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const retencao = Number(formData.get("retencao") ?? 0);
  const aditivo = Number(formData.get("aditivo") ?? 0);
  const status = String(formData.get("status") ?? "rascunho").trim();

  if (!obra_id || !referencia) {
    throw new Error("Campos obrigatorios da medicao ausentes");
  }

  const profile = await getCurrentProfile();
  const roleValue = String(profile?.role ?? "");
  if (!isProfileRole(roleValue)) {
    throw new Error("Perfil inválido para registrar medição");
  }

  const requiresApproval = requiresApprovalForAmount(roleValue, valor);
  const requiredRole = resolveRequiredRoleByAmount(valor);
  const medicaoId = await createMedicao({
    obra_id,
    referencia,
    valor,
    retencao,
    aditivo,
    status: requiresApproval ? "aguardando_aprovacao" : status,
  });

  if (requiresApproval) {
    await createApprovalRequest({
      entityType: "medicao",
      entityId: medicaoId,
      entityRef: referencia,
      amount: valor,
      requesterRole: roleValue,
      requiredRole,
      notes: "Medição acima da alçada do solicitante.",
      metadata: {
        obraId: obra_id,
        retencao,
        aditivo,
      },
    });
  }

  revalidatePath("/financeiro");
}
