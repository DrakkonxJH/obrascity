import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type TenantSecurityPolicy = {
  mfa_required_roles: string[];
  sso_enabled: boolean;
  sso_provider: string;
  sso_entrypoint: string;
  session_timeout_minutes: number;
};

export type TenantSessionItem = {
  id: string;
  profile_id: string | null;
  device_label: string;
  user_agent: string;
  last_seen_at: string;
  revoked_at: string | null;
};

export async function getTenantSecurityPolicy(): Promise<TenantSecurityPolicy> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_security_policies")
    .select("mfa_required_roles, sso_enabled, sso_provider, sso_entrypoint, session_timeout_minutes")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao carregar política de segurança: ${error.message}`);
  }

  return {
    mfa_required_roles: Array.isArray(data?.mfa_required_roles)
      ? (data?.mfa_required_roles as string[])
      : [],
    sso_enabled: Boolean(data?.sso_enabled),
    sso_provider: String(data?.sso_provider ?? ""),
    sso_entrypoint: String(data?.sso_entrypoint ?? ""),
    session_timeout_minutes: Number(data?.session_timeout_minutes ?? 43200),
  };
}

export async function upsertTenantSecurityPolicy(input: TenantSecurityPolicy) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("tenant_security_policies").upsert(
    {
      empresa_id: empresaId,
      mfa_required_roles: input.mfa_required_roles,
      sso_enabled: input.sso_enabled,
      sso_provider: input.sso_provider || null,
      sso_entrypoint: input.sso_entrypoint || null,
      session_timeout_minutes: input.session_timeout_minutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id" },
  );

  if (error) {
    throw new Error(`Erro ao salvar política de segurança: ${error.message}`);
  }
}

export async function listTenantAuthSessions(): Promise<TenantSessionItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_auth_sessions")
    .select("id, profile_id, device_label, user_agent, last_seen_at, revoked_at")
    .eq("empresa_id", empresaId)
    .order("last_seen_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Erro ao listar sessões: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    profile_id: row.profile_id ? String(row.profile_id) : null,
    device_label: String(row.device_label ?? "Dispositivo"),
    user_agent: String(row.user_agent ?? "N/A"),
    last_seen_at: String(row.last_seen_at ?? ""),
    revoked_at: row.revoked_at ? String(row.revoked_at) : null,
  }));
}

export async function revokeTenantSession(sessionId: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("tenant_auth_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("empresa_id", empresaId)
    .eq("id", sessionId)
    .is("revoked_at", null);

  if (error) {
    throw new Error(`Erro ao revogar sessão: ${error.message}`);
  }
}

