"use server";

import { revalidatePath } from "next/cache";
import { CRM_STAGES, createCrmActivity, createCrmBoard, createCrmDeal } from "@/lib/db/crm";
import { requireClientProfileOrThrow } from "@/lib/auth/require-client-account";

function parsePriority(value: string | null): "baixa" | "media" | "alta" {
  if (value === "baixa" || value === "media" || value === "alta") return value;
  return "media";
}

export async function createCrmDealAction(formData: FormData) {
  const profile = await requireClientProfileOrThrow();

  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const stage = String(formData.get("stage") ?? "novos").trim().toLowerCase();
  const obraIdRaw = String(formData.get("obra_id") ?? "").trim();
  const boardTagRaw = String(formData.get("board_tag") ?? "").trim().toLowerCase();
  const priority = parsePriority(String(formData.get("priority") ?? "media").trim().toLowerCase());
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const boardTag = boardTagRaw.startsWith("board:") ? boardTagRaw : null;
  const normalizedTags = boardTag && !tags.includes(boardTag) ? [boardTag, ...tags] : tags;

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
    obra_id: obraIdRaw || null,
    tags: normalizedTags,
  });
  revalidatePath("/crm");
}

export async function createCrmActivityAction(formData: FormData) {
  await requireClientProfileOrThrow();
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

export async function createCrmBoardAction(formData: FormData) {
  await requireClientProfileOrThrow();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) {
    throw new Error("Nome do quadro obrigatorio");
  }

  await createCrmBoard({ label });
  revalidatePath("/crm");
}
