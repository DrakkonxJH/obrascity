"use server";

import { revalidatePath } from "next/cache";
import {
  createChecklistItem,
  createEvidencia,
  createNaoConformidade,
  createPlanoAcao,
  updateChecklistStatus,
  updateNaoConformidade,
  updatePlanoAcaoStatus,
} from "@/lib/db/qualidade";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { canApproveForRole } from "@/lib/approvals/policy";

export async function createNaoConformidadeAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const severidade = String(formData.get("severidade") ?? "media").trim();
  const prazo = String(formData.get("prazo") ?? "").trim();
  const responsavel_id = String(formData.get("responsavel_id") ?? "").trim();
  const profile = await getCurrentProfile();
  const rawRole = String(profile?.role ?? "");
  if (!isProfileRole(rawRole)) {
    throw new Error("Perfil inválido para criar não conformidade.");
  }

  const requiredRole = severidade === "alta" ? "gestor" : "engenheiro";
  const requiresApproval = severidade === "alta" && !canApproveForRole(rawRole, requiredRole);
  const status = requiresApproval ? "aguardando_aprovacao" : "aberta";

  if (!obra_id || !categoria || !descricao) {
    throw new Error("Campos obrigatorios da não conformidade ausentes");
  }

  const naoConformidadeId = await createNaoConformidade({
    obra_id,
    categoria,
    descricao,
    severidade,
    prazo,
    responsavel_id,
    status,
  });
  if (requiresApproval) {
    await createApprovalRequest({
      entityType: "quality_issue",
      entityId: naoConformidadeId,
      entityRef: categoria,
      amount: 0,
      requesterRole: rawRole,
      requiredRole,
      notes: "Não conformidade de alta severidade exige aprovação.",
      metadata: { obraId: obra_id, severidade, categoria },
    });
  }
  revalidatePath("/qualidade");
  revalidatePath("/governanca");
}

export async function updateNaoConformidadeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const severidade = String(formData.get("severidade") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim();
  const responsavel_id = String(formData.get("responsavel_id") ?? "").trim();
  const resolucao = String(formData.get("resolucao") ?? "").trim();

  if (!id) {
    throw new Error("Nao conformidade invalida para atualizacao");
  }

  await updateNaoConformidade({
    id,
    status,
    severidade,
    prazo,
    responsavel_id,
    resolucao,
  });
  revalidatePath("/qualidade");
}

export async function createPlanoAcaoAction(formData: FormData) {
  const nao_conformidade_id = String(formData.get("nao_conformidade_id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim();
  const responsavel_id = String(formData.get("responsavel_id") ?? "").trim();

  if (!nao_conformidade_id || !titulo) {
    throw new Error("Plano de acao requer não conformidade e titulo");
  }

  await createPlanoAcao({
    nao_conformidade_id,
    titulo,
    descricao,
    prazo,
    responsavel_id,
  });
  revalidatePath("/qualidade");
}

export async function updatePlanoAcaoStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !status) {
    throw new Error("Status de plano de acao invalido");
  }

  await updatePlanoAcaoStatus({ id, status });
  revalidatePath("/qualidade");
}

export async function createEvidenciaAction(formData: FormData) {
  const nao_conformidade_id = String(formData.get("nao_conformidade_id") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!nao_conformidade_id || !url) {
    throw new Error("Evidencia requer não conformidade e URL");
  }

  await createEvidencia({
    nao_conformidade_id,
    url,
    descricao,
  });
  revalidatePath("/qualidade");
}

export async function createChecklistAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const norma = String(formData.get("norma") ?? "").trim();
  const item = String(formData.get("item") ?? "").trim();
  const status = String(formData.get("status") ?? "pendente").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();
  const responsavel_id = String(formData.get("responsavel_id") ?? "").trim();

  if (!obra_id || !norma || !item) {
    throw new Error("Campos obrigatorios do checklist ausentes");
  }

  await createChecklistItem({
    obra_id,
    norma,
    item,
    status,
    observacao,
    responsavel_id,
  });
  revalidatePath("/qualidade");
}

export async function updateChecklistStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();
  const responsavel_id = String(formData.get("responsavel_id") ?? "").trim();

  if (!id || !status) {
    throw new Error("Checklist invalido para atualizacao");
  }

  await updateChecklistStatus({
    id,
    status,
    observacao,
    responsavel_id,
  });
  revalidatePath("/qualidade");
}
