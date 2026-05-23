"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertControlTotal() {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) {
    throw new Error("Acesso negado");
  }
  return profile;
}

async function logMasterAudit(input: {
  action: string;
  targetType: string;
  targetId?: string | null;
  empresaId?: string | null;
  details?: Record<string, unknown>;
}) {
  const actor = await getCurrentProfile();
  const admin = createAdminClient();
  await admin.from("master_audit_logs").insert({
    actor_profile_id: actor?.id ?? null,
    actor_email: actor?.email ?? null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    empresa_id: input.empresaId ?? null,
    details: input.details ?? {},
  });
}

export async function suspenderEmpresaAction(empresaId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update({ status: "suspended" })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao suspender: ${error.message}`);
  await logMasterAudit({
    action: "empresa_suspensa",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
  });
  revalidatePath("/contas");
}

export async function ativarEmpresaAction(empresaId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update({ status: "trialing" })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao ativar: ${error.message}`);
  await logMasterAudit({
    action: "empresa_ativada",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
  });
  revalidatePath("/contas");
}

export async function alterarPlanoAction(empresaId: string, formData: FormData) {
  await assertControlTotal();
  const plano = String(formData.get("plano") ?? "").trim();
  if (!plano) throw new Error("Plano inválido");
  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update({ plano })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao alterar plano: ${error.message}`);
  await logMasterAudit({
    action: "plano_alterado",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { plano },
  });
  revalidatePath("/contas");
}

export async function removerPerfilAction(profileId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) throw new Error(`Erro ao remover usuário: ${error.message}`);
  await logMasterAudit({
    action: "usuario_removido",
    targetType: "profile",
    targetId: profileId,
  });
  revalidatePath("/contas");
}

export async function resetarDadosEmpresaAction(empresaId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  // Remove operational data; keep empresa, profiles, assinatura
  const tables = [
    "diario_obra",
    "nao_conformidades",
    "materiais",
    "membros",
    "equipes",
    "obras",
  ] as const;
  for (const table of tables) {
    await admin.from(table).delete().eq("empresa_id", empresaId);
  }
  await logMasterAudit({
    action: "empresa_reset_dados",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { tables },
  });
  revalidatePath("/contas");
}

export async function estenderPeriodoEmpresaAction(empresaId: string, formData: FormData) {
  await assertControlTotal();
  const days = Number(formData.get("days") ?? 0);
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("Quantidade de dias inválida");
  }
  const admin = createAdminClient();
  const { data: assinatura, error: assinaturaError } = await admin
    .from("assinaturas")
    .select("periodo_fim")
    .eq("empresa_id", empresaId)
    .maybeSingle();
  if (assinaturaError) {
    throw new Error(`Erro ao carregar assinatura: ${assinaturaError.message}`);
  }
  const base = assinatura?.periodo_fim ? new Date(assinatura.periodo_fim) : new Date();
  base.setDate(base.getDate() + days);
  const { error } = await admin
    .from("assinaturas")
    .update({ periodo_fim: base.toISOString() })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao estender período: ${error.message}`);
  await logMasterAudit({
    action: "assinatura_estendida",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { days, novo_periodo_fim: base.toISOString() },
  });
  revalidatePath("/contas");
}

export async function criarTicketSuporteAction(formData: FormData) {
  const actor = await assertControlTotal();
  const empresaId = String(formData.get("empresa_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "suporte").trim();
  const priority = String(formData.get("priority") ?? "media").trim();
  const slaHours = Number(formData.get("sla_hours") ?? 0);
  if (!empresaId || !title) {
    throw new Error("Ticket precisa de empresa e título");
  }
  const admin = createAdminClient();
  const deadline =
    Number.isFinite(slaHours) && slaHours > 0
      ? new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()
      : null;
  const { data, error } = await admin
    .from("support_tickets")
    .insert({
      empresa_id: empresaId,
      opened_by_profile_id: actor?.id ?? null,
      owner_profile_id: actor?.id ?? null,
      title,
      description,
      category,
      priority,
      status: "aberto",
      sla_deadline: deadline,
      metadata: { origin: "master_console" },
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`Erro ao criar ticket: ${error?.message ?? "sem id"}`);
  }
  await admin.from("support_ticket_events").insert({
    ticket_id: data.id,
    actor_profile_id: actor?.id ?? null,
    event_type: "ticket_criado",
    message: description || null,
    metadata: { category, priority },
  });
  await logMasterAudit({
    action: "ticket_criado",
    targetType: "support_ticket",
    targetId: data.id,
    empresaId,
    details: { category, priority, sla_deadline: deadline },
  });
  revalidatePath("/contas");
}

export async function atualizarTicketSuporteAction(ticketId: string, formData: FormData) {
  const actor = await assertControlTotal();
  const status = String(formData.get("status") ?? "").trim();
  const ownerProfileId = String(formData.get("owner_profile_id") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  if (!ticketId || !status) {
    throw new Error("Ticket/status inválidos");
  }
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (ownerProfileId) {
    updatePayload.owner_profile_id = ownerProfileId;
  }
  const { data, error } = await admin
    .from("support_tickets")
    .update(updatePayload)
    .eq("id", ticketId)
    .select("id, empresa_id")
    .single();
  if (error || !data?.id) {
    throw new Error(`Erro ao atualizar ticket: ${error?.message ?? "não encontrado"}`);
  }
  await admin.from("support_ticket_events").insert({
    ticket_id: ticketId,
    actor_profile_id: actor?.id ?? null,
    event_type: "ticket_atualizado",
    message: comment || null,
    metadata: { status, owner_profile_id: ownerProfileId || null },
  });
  await logMasterAudit({
    action: "ticket_atualizado",
    targetType: "support_ticket",
    targetId: ticketId,
    empresaId: data.empresa_id,
    details: { status, owner_profile_id: ownerProfileId || null },
  });
  revalidatePath("/contas");
}

export async function resetarSenhaUsuarioAction(profileId: string, formData: FormData) {
  await assertControlTotal();
  const password = String(formData.get("password") ?? "").trim();
  if (password.length < 8) {
    throw new Error("Senha deve ter no mínimo 8 caracteres");
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profileId, { password });
  if (error) throw new Error(`Erro ao resetar senha: ${error.message}`);
  await logMasterAudit({
    action: "usuario_senha_resetada",
    targetType: "profile",
    targetId: profileId,
  });
  revalidatePath("/contas");
}
