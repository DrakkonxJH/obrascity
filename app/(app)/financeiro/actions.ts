"use server";

import { revalidatePath } from "next/cache";
import { createFinanceiroItem } from "@/lib/db/financeiro";
import { createApprovalRequest } from "@/lib/db/approvals";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";
import { createFinanceiroTitulo, settleFinanceiroTitulo } from "@/lib/db/financeiro-corporativo";

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

export async function createFinanceiroTituloAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "ap").trim() === "ar" ? "ar" : "ap";
  const centroCusto = String(formData.get("centro_custo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const vencimento = String(formData.get("vencimento") ?? "").trim();

  if (!obraId || !centroCusto || !descricao || !vencimento) {
    throw new Error("Título financeiro exige obra, centro de custo, descrição e vencimento");
  }

  const profile = await getCurrentProfile();
  const roleValue = String(profile?.role ?? "");
  if (!profile?.id || !isProfileRole(roleValue)) {
    throw new Error("Perfil inválido para registrar título financeiro");
  }

  const requiresApproval = requiresApprovalForAmount(roleValue, valor);
  const status = requiresApproval ? "aguardando_aprovacao" : "aprovado";
  const tituloId = await createFinanceiroTitulo({
    obraId,
    tipo,
    centroCusto,
    descricao,
    valor,
    vencimento,
    status,
  });

  if (requiresApproval) {
    await createApprovalRequest({
      entityType: "financial_entry",
      entityId: tituloId,
      entityRef: descricao,
      amount: valor,
      requesterRole: roleValue,
      requiredRole: resolveRequiredRoleByAmount(valor),
      notes: "Título financeiro acima da alçada do solicitante.",
      metadata: {
        obraId,
        tipo,
        centroCusto,
        vencimento,
      },
    });
  }

  revalidatePath("/financeiro");
  revalidatePath("/governanca");
}

export async function settleFinanceiroTituloAction(formData: FormData) {
  const tituloId = String(formData.get("titulo_id") ?? "").trim();
  const valorLiquidado = Number(formData.get("valor_liquidado") ?? 0);
  const conciliado = String(formData.get("conciliado") ?? "") === "on";

  if (!tituloId) {
    throw new Error("Título obrigatório para liquidação");
  }

  await settleFinanceiroTitulo({
    tituloId,
    valorLiquidado,
    conciliado,
  });

  revalidatePath("/financeiro");
}
