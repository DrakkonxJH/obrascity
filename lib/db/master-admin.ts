import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingRelation } from "@/lib/db/migration-guard";

export type TenantAdminOverride = {
  empresa_id: string;
  empresa_nome: string;
  profile_limit_override: number | null;
  report_daily_limit_override: number | null;
  storage_limit_mb: number | null;
  support_sla_hours: number | null;
  notes: string | null;
  updated_by_profile_id: string | null;
  updated_at: string;
};

export type TenantFeatureFlag = {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  feature_key: string;
  enabled: boolean;
  rollout_scope: string;
  notes: string | null;
  updated_by_profile_id: string | null;
  updated_at: string;
};

export type TenantImpersonationSession = {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  profile_id: string | null;
  actor_profile_id: string | null;
  actor_email: string | null;
  reason: string;
  active: boolean;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

export type TenantBroadcast = {
  id: string;
  empresa_id: string | null;
  empresa_nome: string | null;
  title: string;
  message: string;
  severity: string;
  audience: string;
  created_by_profile_id: string | null;
  published_at: string | null;
  created_at: string;
};

function mapCompanyNames(rows: Array<{ id: string; nome: string }>) {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, row.nome);
  }
  return map;
}

export async function listTenantAdminOverrides(): Promise<TenantAdminOverride[]> {
  const admin = createAdminClient();
  const [overridesRes, empresasRes] = await Promise.all([
    admin
      .from("tenant_admin_overrides")
      .select(
        "empresa_id, profile_limit_override, report_daily_limit_override, storage_limit_mb, support_sla_hours, notes, updated_by_profile_id, updated_at",
      )
      .order("updated_at", { ascending: false }),
    admin.from("empresas").select("id, nome"),
  ]);

  if (overridesRes.error) {
    if (isMissingRelation(overridesRes.error.message)) return [];
    throw new Error(overridesRes.error.message);
  }

  const empresaMap = mapCompanyNames((empresasRes.data ?? []) as Array<{ id: string; nome: string }>);
  return (overridesRes.data ?? []).map((row) => ({
    empresa_id: row.empresa_id,
    empresa_nome: empresaMap.get(row.empresa_id) ?? "—",
    profile_limit_override: row.profile_limit_override ?? null,
    report_daily_limit_override: row.report_daily_limit_override ?? null,
    storage_limit_mb: row.storage_limit_mb ?? null,
    support_sla_hours: row.support_sla_hours ?? null,
    notes: row.notes ?? null,
    updated_by_profile_id: row.updated_by_profile_id ?? null,
    updated_at: row.updated_at,
  }));
}

export async function upsertTenantAdminOverride(input: Omit<TenantAdminOverride, "empresa_nome" | "updated_at"> & {
  updated_by_profile_id: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("tenant_admin_overrides").upsert(
    {
      empresa_id: input.empresa_id,
      profile_limit_override: input.profile_limit_override,
      report_daily_limit_override: input.report_daily_limit_override,
      storage_limit_mb: input.storage_limit_mb,
      support_sla_hours: input.support_sla_hours,
      notes: input.notes,
      updated_by_profile_id: input.updated_by_profile_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id" },
  );

  if (error) {
    if (isMissingRelation(error.message)) return;
    throw new Error(`Erro ao salvar sobrescrita de tenant: ${error.message}`);
  }
}

export async function listTenantFeatureFlags(): Promise<TenantFeatureFlag[]> {
  const admin = createAdminClient();
  const [flagsRes, empresasRes] = await Promise.all([
    admin
      .from("tenant_feature_flags")
      .select("id, empresa_id, feature_key, enabled, rollout_scope, notes, updated_by_profile_id, updated_at")
      .order("updated_at", { ascending: false }),
    admin.from("empresas").select("id, nome"),
  ]);

  if (flagsRes.error) {
    if (isMissingRelation(flagsRes.error.message)) return [];
    throw new Error(flagsRes.error.message);
  }

  const empresaMap = mapCompanyNames((empresasRes.data ?? []) as Array<{ id: string; nome: string }>);
  return (flagsRes.data ?? []).map((row) => ({
    id: row.id,
    empresa_id: row.empresa_id,
    empresa_nome: empresaMap.get(row.empresa_id) ?? "—",
    feature_key: row.feature_key,
    enabled: Boolean(row.enabled),
    rollout_scope: row.rollout_scope ?? "all",
    notes: row.notes ?? null,
    updated_by_profile_id: row.updated_by_profile_id ?? null,
    updated_at: row.updated_at,
  }));
}

export async function upsertTenantFeatureFlag(input: {
  empresa_id: string;
  feature_key: string;
  enabled: boolean;
  rollout_scope?: string | null;
  notes?: string | null;
  updated_by_profile_id: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("tenant_feature_flags").upsert(
    {
      empresa_id: input.empresa_id,
      feature_key: input.feature_key,
      enabled: input.enabled,
      rollout_scope: input.rollout_scope ?? "all",
      notes: input.notes ?? null,
      updated_by_profile_id: input.updated_by_profile_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,feature_key" },
  );

  if (error) {
    if (isMissingRelation(error.message)) return;
    throw new Error(`Erro ao salvar feature flag: ${error.message}`);
  }
}

export async function removeTenantFeatureFlag(empresaId: string, featureKey: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("tenant_feature_flags")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("feature_key", featureKey);
  if (error && !isMissingRelation(error.message)) {
    throw new Error(`Erro ao remover feature flag: ${error.message}`);
  }
}

export async function listTenantImpersonationSessions(): Promise<TenantImpersonationSession[]> {
  const admin = createAdminClient();
  const [sessionsRes, empresasRes] = await Promise.all([
    admin
      .from("tenant_impersonation_sessions")
      .select(
        "id, empresa_id, profile_id, actor_profile_id, actor_email, reason, active, expires_at, revoked_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(80),
    admin.from("empresas").select("id, nome"),
  ]);

  if (sessionsRes.error) {
    if (isMissingRelation(sessionsRes.error.message)) return [];
    throw new Error(sessionsRes.error.message);
  }

  const empresaMap = mapCompanyNames((empresasRes.data ?? []) as Array<{ id: string; nome: string }>);
  return (sessionsRes.data ?? []).map((row) => ({
    id: row.id,
    empresa_id: row.empresa_id,
    empresa_nome: empresaMap.get(row.empresa_id) ?? "—",
    profile_id: row.profile_id ?? null,
    actor_profile_id: row.actor_profile_id ?? null,
    actor_email: row.actor_email ?? null,
    reason: row.reason,
    active: Boolean(row.active),
    expires_at: row.expires_at,
    revoked_at: row.revoked_at ?? null,
    created_at: row.created_at,
  }));
}

export async function createTenantImpersonationSession(input: {
  empresaId: string;
  profileId: string | null;
  actorProfileId: string | null;
  actorEmail: string | null;
  reason: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenant_impersonation_sessions")
    .insert({
      empresa_id: input.empresaId,
      profile_id: input.profileId,
      actor_profile_id: input.actorProfileId,
      actor_email: input.actorEmail,
      reason: input.reason,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingRelation(error.message)) return null;
    throw new Error(`Erro ao criar sessão assistida: ${error.message}`);
  }

  return String(data.id);
}

export async function revokeTenantImpersonationSession(sessionId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("tenant_impersonation_sessions")
    .update({ active: false, revoked_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error && !isMissingRelation(error.message)) {
    throw new Error(`Erro ao revogar sessão assistida: ${error.message}`);
  }
}

export async function listTenantBroadcasts(): Promise<TenantBroadcast[]> {
  const admin = createAdminClient();
  const [broadcastsRes, empresasRes] = await Promise.all([
    admin
      .from("tenant_broadcasts")
      .select("id, empresa_id, title, message, severity, audience, created_by_profile_id, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    admin.from("empresas").select("id, nome"),
  ]);

  if (broadcastsRes.error) {
    if (isMissingRelation(broadcastsRes.error.message)) return [];
    throw new Error(broadcastsRes.error.message);
  }

  const empresaMap = mapCompanyNames((empresasRes.data ?? []) as Array<{ id: string; nome: string }>);
  return (broadcastsRes.data ?? []).map((row) => ({
    id: row.id,
    empresa_id: row.empresa_id ?? null,
    empresa_nome: row.empresa_id ? empresaMap.get(row.empresa_id) ?? null : null,
    title: row.title,
    message: row.message,
    severity: row.severity,
    audience: row.audience,
    created_by_profile_id: row.created_by_profile_id ?? null,
    published_at: row.published_at ?? null,
    created_at: row.created_at,
  }));
}

export async function createTenantBroadcast(input: {
  empresaId: string | null;
  title: string;
  message: string;
  severity: string;
  audience: string;
  createdByProfileId: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenant_broadcasts")
    .insert({
      empresa_id: input.empresaId,
      title: input.title,
      message: input.message,
      severity: input.severity,
      audience: input.audience,
      created_by_profile_id: input.createdByProfileId,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingRelation(error.message)) return null;
    throw new Error(`Erro ao criar comunicado: ${error.message}`);
  }

  return String(data.id);
}
