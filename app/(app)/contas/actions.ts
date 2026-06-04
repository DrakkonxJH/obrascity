"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { getRequestIpFromHeaders, isMasterIpAllowed } from "@/lib/auth/master-access";
import { isAssignableProfileRole, type ProfileRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTenantBroadcast,
  createTenantImpersonationSession,
  removeTenantFeatureFlag,
  revokeTenantImpersonationSession,
  upsertTenantAdminOverride,
  upsertTenantFeatureFlag,
} from "@/lib/db/master-admin";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const SECURITY_ALERT_STATUSES = new Set(["open", "in_progress", "resolved", "ignored"]);
const VALID_PLANS = new Set(["trial", "starter", "pro", "enterprise"]);

async function assertControlTotal() {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) {
    throw new Error("Acesso negado");
  }
  const ip = getRequestIpFromHeaders(await headers());
  if (!isMasterIpAllowed(ip)) {
    throw new Error("Acesso restrito por allowlist de IP");
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

function parseOptionalNumber(value: string, fieldName: string) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Valor inválido para ${fieldName}`);
  }
  return parsed;
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
  const plano = String(formData.get("plano") ?? "").trim().toLowerCase();
  if (!VALID_PLANS.has(plano)) throw new Error("Plano inválido");

  const now = new Date();
  const assinaturaPatch: {
    plano: string;
    status: string;
    periodo_fim: string | null;
  } = {
    plano,
    status: plano === "trial" ? "trialing" : "active",
    periodo_fim: null,
  };

  if (plano === "trial") {
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + 14);
    assinaturaPatch.periodo_fim = endsAt.toISOString();
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update(assinaturaPatch)
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao alterar plano: ${error.message}`);

  const { error: empresaError } = await admin
    .from("empresas")
    .update({ plano, updated_at: now.toISOString() })
    .eq("id", empresaId);
  if (empresaError) throw new Error(`Erro ao sincronizar plano da empresa: ${empresaError.message}`);

  await logMasterAudit({
    action: "plano_alterado",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { plano, status: assinaturaPatch.status, periodo_fim: assinaturaPatch.periodo_fim },
  });
  revalidatePath("/contas");
}

export async function removerPerfilAction(profileId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { data: targetProfile, error: loadError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", profileId)
    .maybeSingle();
  if (loadError) throw new Error(`Erro ao carregar perfil: ${loadError.message}`);
  if (String(targetProfile?.role ?? "").toLowerCase() === "master") {
    throw new Error("Perfil master não pode ser removido");
  }
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
   .select("id, status, periodo_fim, created_at")
    .eq("empresa_id", empresaId)
   .order("created_at", { ascending: false })
   .limit(1)
   .maybeSingle();
  if (assinaturaError) {
   throw new Error(`Erro ao carregar assinatura: ${assinaturaError.message}`);
  }
  if (!assinatura?.id) {
   throw new Error("Nenhuma assinatura encontrada para esta empresa");
  }

  const base = assinatura.periodo_fim ? new Date(assinatura.periodo_fim) : new Date();
  base.setDate(base.getDate() + days);
  const { error } = await admin
   .from("assinaturas")
   .update({
     periodo_fim: base.toISOString(),
     status: String(assinatura.status).toLowerCase() === "trialing" ? "trialing" : "active",
     updated_at: new Date().toISOString(),
   })
   .eq("id", assinatura.id);
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

export async function atualizarSecurityAlertAction(alertId: string, formData: FormData) {
  const actor = await assertControlTotal();
  const status = String(formData.get("status") ?? "").trim().toLowerCase();
  const note = String(formData.get("note") ?? "").trim();
  if (!alertId || !SECURITY_ALERT_STATUSES.has(status)) {
    throw new Error("Alerta/status inválidos");
  }

  const resolved = status === "resolved" || status === "ignored";
  const admin = createAdminClient();
  const { data: alertData, error: alertError } = await admin
    .from("security_alerts")
    .select("metadata")
    .eq("id", alertId)
    .maybeSingle();

  if (alertError) {
    throw new Error(`Erro ao carregar alerta de segurança: ${alertError.message}`);
  }

  const currentMetadata = ((alertData?.metadata ?? {}) as Record<string, unknown>) ?? {};
  const nextMetadata: Record<string, unknown> = {
    ...currentMetadata,
    remediation_status: status,
    remediation_note: note || null,
    remediation_resolved_at: resolved ? new Date().toISOString() : null,
    remediation_resolved_by_profile_id: resolved ? actor?.id ?? null : null,
  };

  const { error } = await admin
    .from("security_alerts")
    .update({
      metadata: nextMetadata,
    })
    .eq("id", alertId);

  if (error) {
    throw new Error(`Erro ao atualizar alerta de segurança: ${error.message}`);
  }

  await logMasterAudit({
    action: "security_alert_atualizado",
    targetType: "security_alert",
    targetId: alertId,
    details: { status, note: note || null },
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
  const { data: targetProfile, error: loadError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", profileId)
    .maybeSingle();
  if (loadError) throw new Error(`Erro ao carregar perfil: ${loadError.message}`);
  if (String(targetProfile?.role ?? "").toLowerCase() === "master") {
    throw new Error("Perfil master não pode ter a senha resetada por esta tela");
  }
  const { error } = await admin.auth.admin.updateUserById(profileId, { password });
  if (error) throw new Error(`Erro ao resetar senha: ${error.message}`);
  await logMasterAudit({
    action: "usuario_senha_resetada",
    targetType: "profile",
    targetId: profileId,
  });
  revalidatePath("/contas");
}

export async function atualizarPerfilUsuarioAction(profileId: string, formData: FormData) {
  await assertControlTotal();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim().toLowerCase();
  const role = roleRaw ? (roleRaw as ProfileRole) : null;

  if (role && !isAssignableProfileRole(role)) {
    throw new Error("Papel inválido");
  }

  const admin = createAdminClient();
  const { data: targetProfile, error: loadError } = await admin
    .from("profiles")
    .select("id, empresa_id, role")
    .eq("id", profileId)
    .maybeSingle();

  if (loadError) {
    throw new Error(`Erro ao carregar perfil: ${loadError.message}`);
  }

  if (!targetProfile?.id) {
    throw new Error("Perfil não encontrado");
  }

  if (String(targetProfile.role ?? "").toLowerCase() === "master") {
    throw new Error("Perfil master não pode ser alterado por esta tela");
  }

  const updatePayload: Record<string, unknown> = {
    cargo: cargo || null,
  };
  if (role) {
    updatePayload.role = role;
  }

  const { error } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", profileId);

  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`);
  }

  await admin
    .from("membros")
    .update({ cargo: cargo || null })
    .eq("empresa_id", targetProfile.empresa_id)
    .eq("profile_id", profileId);

  await logMasterAudit({
    action: "perfil_atualizado",
    targetType: "profile",
    targetId: profileId,
    empresaId: targetProfile.empresa_id,
    details: { cargo: cargo || null, role: role ?? null },
  });

  revalidatePath("/contas");
}

export async function salvarLimitesEmpresaAction(empresaId: string, formData: FormData) {
  const actor = await assertControlTotal();
  const profileLimit = String(formData.get("profile_limit_override") ?? "").trim();
  const reportDailyLimit = String(formData.get("report_daily_limit_override") ?? "").trim();
  const storageLimit = String(formData.get("storage_limit_mb") ?? "").trim();
  const supportSlaHours = String(formData.get("support_sla_hours") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  await upsertTenantAdminOverride({
    empresa_id: empresaId,
    profile_limit_override: parseOptionalNumber(profileLimit, "perfil"),
    report_daily_limit_override: parseOptionalNumber(reportDailyLimit, "relatórios/dia"),
    storage_limit_mb: parseOptionalNumber(storageLimit, "storage"),
    support_sla_hours: parseOptionalNumber(supportSlaHours, "SLA"),
    notes: notes || null,
    updated_by_profile_id: actor?.id ?? null,
  });

  await logMasterAudit({
    action: "tenant_limites_atualizados",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: {
    profile_limit_override: parseOptionalNumber(profileLimit, "perfil"),
    report_daily_limit_override: parseOptionalNumber(reportDailyLimit, "relatórios/dia"),
    storage_limit_mb: parseOptionalNumber(storageLimit, "storage"),
    support_sla_hours: parseOptionalNumber(supportSlaHours, "SLA"),
    },
  });

  revalidatePath("/contas");
}

export async function salvarFeatureFlagAction(formData: FormData) {
  const actor = await assertControlTotal();
  const empresaId = String(formData.get("empresa_id") ?? "").trim();
  const featureKey = String(formData.get("feature_key") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "").trim() === "on";
  const rolloutScope = String(formData.get("rollout_scope") ?? "all").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!empresaId || !featureKey) {
    throw new Error("Feature key obrigatória");
  }

  await upsertTenantFeatureFlag({
    empresa_id: empresaId,
    feature_key: featureKey,
    enabled,
    rollout_scope: rolloutScope || "all",
    notes: notes || null,
    updated_by_profile_id: actor?.id ?? null,
  });

  await logMasterAudit({
    action: "tenant_feature_flag_atualizada",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { feature_key: featureKey, enabled, rollout_scope: rolloutScope || "all" },
  });

  revalidatePath("/contas");
}

export async function removerFeatureFlagAction(empresaId: string, formData: FormData) {
  await assertControlTotal();
  const featureKey = String(formData.get("feature_key") ?? "").trim();
  if (!featureKey) {
    throw new Error("Feature key obrigatória");
  }

  await removeTenantFeatureFlag(empresaId, featureKey);

  await logMasterAudit({
    action: "tenant_feature_flag_removida",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { feature_key: featureKey },
  });

  revalidatePath("/contas");
}

export async function criarComunicadoTenantAction(formData: FormData) {
  const actor = await assertControlTotal();
  const empresaId = String(formData.get("empresa_id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const severity = String(formData.get("severity") ?? "info").trim().toLowerCase();
  const audience = String(formData.get("audience") ?? "all").trim().toLowerCase();

  if (!title || !message) {
    throw new Error("Comunicado precisa de título e mensagem");
  }

  const broadcastId = await createTenantBroadcast({
    empresaId,
    title,
    message,
    severity,
    audience,
    createdByProfileId: actor?.id ?? null,
  });

  if (empresaId) {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin.from("profiles").select("id").eq("empresa_id", empresaId);
    if (error) throw new Error(`Erro ao carregar perfis para comunicado: ${error.message}`);
    const rows = (profiles ?? []).map((profile) => ({
      empresa_id: empresaId,
      user_id: profile.id,
      titulo: title,
      lida: false,
      link: "/suporte",
    }));
    if (rows.length > 0) {
      const { error: notifError } = await admin.from("notificacoes").insert(rows);
      if (notifError) throw new Error(`Erro ao criar notificações: ${notifError.message}`);
    }
  } else {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin.from("profiles").select("id, empresa_id");
    if (error) throw new Error(`Erro ao carregar perfis para comunicado global: ${error.message}`);
    const rows = (profiles ?? []).map((profile) => ({
      empresa_id: profile.empresa_id,
      user_id: profile.id,
      titulo: title,
      lida: false,
      link: "/suporte",
    }));
    if (rows.length > 0) {
      const { error: notifError } = await admin.from("notificacoes").insert(rows);
      if (notifError) throw new Error(`Erro ao criar notificações globais: ${notifError.message}`);
    }
  }

  await logMasterAudit({
    action: "tenant_comunicado_enviado",
    targetType: "broadcast",
    targetId: broadcastId,
    empresaId,
    details: { title, severity, audience },
  });

  revalidatePath("/contas");
}

export async function iniciarAcessoAssistidoAction(formData: FormData) {
  const actor = await assertControlTotal();
  const empresaId = String(formData.get("empresa_id") ?? "").trim();
  const profileId = String(formData.get("profile_id") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "Acesso assistido para suporte").trim();

  if (!empresaId) {
    throw new Error("Empresa obrigatória");
  }

  const sessionId = await createTenantImpersonationSession({
    empresaId,
    profileId,
    actorProfileId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    reason,
  });

  const cookieStore = await cookies();
  cookieStore.set("of_support_preview_empresa_id", empresaId, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  if (profileId) {
    cookieStore.set("of_support_preview_profile_id", profileId, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  if (sessionId) {
    cookieStore.set("of_support_preview_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  await logMasterAudit({
    action: "tenant_acesso_assistido_iniciado",
    targetType: "empresa",
    targetId: empresaId,
    empresaId,
    details: { profileId, reason, sessionId },
  });

  redirect("/dashboard");
}

export async function encerrarAcessoAssistidoAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("of_support_preview_session_id")?.value ?? null;
  if (sessionId) {
    await revokeTenantImpersonationSession(sessionId);
  }
  cookieStore.delete("of_support_preview_empresa_id");
  cookieStore.delete("of_support_preview_profile_id");
  cookieStore.delete("of_support_preview_session_id");
  redirect("/contas");
}
