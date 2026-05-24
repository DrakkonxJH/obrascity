"use server";

import { revalidatePath } from "next/cache";
import { CRM_STAGES, createCrmActivity, createCrmDeal } from "@/lib/db/crm";
import { getCurrentProfile } from "@/lib/auth/require-profile";

function parsePriority(value: string | null): "baixa" | "media" | "alta" {
  if (value === "baixa" || value === "media" || value === "alta") return value;
  return "media";
}

export async function createCrmDealAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sessao invalida");

  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const stage = String(formData.get("stage") ?? "novos").trim().toLowerCase();
  const priority = parsePriority(String(formData.get("priority") ?? "media").trim().toLowerCase());
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!nome) {
    throw new Error("Nome do negocio obrigatorio");
  }
  if (!Number.isFinite(valor) || valor < 0) {
    throw new Error("Valor do negocio invalido");
  }
  if (!CRM_STAGES.includes(stage as (typeof CRM_STAGES)[number])) {
    throw new Error("Etapa de pipeline invalida");
  }

  await createCrmDeal({
    nome,
    valor,
    stage: stage as (typeof CRM_STAGES)[number],
    priority,
    owner_profile_id: profile.id,
    tags,
  });
  revalidatePath("/crm");
}

export async function createCrmActivityAction(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "follow_up").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const dueAtRaw = String(formData.get("due_at") ?? "").trim();
  let dueAt: string | null = null;
  if (dueAtRaw) {
    const parsed = new Date(dueAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Data da atividade invalida");
    }
    dueAt = parsed.toISOString();
  }

  if (!dealId || !descricao) {
    throw new Error("Negocio e descricao da atividade sao obrigatorios");
  }

  await createCrmActivity({
    deal_id: dealId,
    tipo,
    descricao,
    due_at: dueAt,
  });
  revalidatePath("/crm");
}
