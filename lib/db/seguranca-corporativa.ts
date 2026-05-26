import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createHash } from "node:crypto";

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

const DEFAULT_TENANT_SECURITY_POLICY: TenantSecurityPolicy = {
  mfa_required_roles: [],
  sso_enabled: false,
  sso_provider: "",
  sso_entrypoint: "",
  session_timeout_minutes: 43200,
};

function isMissingTable(errorMessage: string, tableName: string) {
  const message = errorMessage.toLowerCase();
  return (
    message.includes(tableName.toLowerCase()) &&
    (message.includes("does not exist") ||
      (message.includes("could not find the table") && message.includes("schema cache")))
  );
}

export async function getTenantSecurityPolicy(): Promise<TenantSecurityPolicy> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_security_policies")
    .select("mfa_required_roles, sso_enabled, sso_provider, sso_entrypoint, session_timeout_minutes")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error.message, "tenant_security_policies")) {
      return DEFAULT_TENANT_SECURITY_POLICY;
    }
    throw new Error(`Erro ao carregar política de segurança: ${error.message}`);
  }

  return {
    mfa_required_roles: Array.isArray(data?.mfa_required_roles)
      ? (data?.mfa_required_roles as string[])
      : DEFAULT_TENANT_SECURITY_POLICY.mfa_required_roles,
    sso_enabled: Boolean(data?.sso_enabled ?? DEFAULT_TENANT_SECURITY_POLICY.sso_enabled),
    sso_provider: String(data?.sso_provider ?? DEFAULT_TENANT_SECURITY_POLICY.sso_provider),
    sso_entrypoint: String(data?.sso_entrypoint ?? DEFAULT_TENANT_SECURITY_POLICY.sso_entrypoint),
    session_timeout_minutes: Number(
      data?.session_timeout_minutes ?? DEFAULT_TENANT_SECURITY_POLICY.session_timeout_minutes,
    ),
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
    if (isMissingTable(error.message, "tenant_auth_sessions")) {
      return [];
    }
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
    if (isMissingTable(error.message, "tenant_auth_sessions")) {
      return;
    }
    throw new Error(`Erro ao revogar sessão: ${error.message}`);
  }
}

export function hashIp(ip: string | null | undefined) {
  return ip ? createHash("sha256").update(ip).digest("hex") : null;
}

export async function getTenantSecurityPolicyByEmpresa(empresaId: string): Promise<TenantSecurityPolicy> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_security_policies")
    .select("mfa_required_roles, sso_enabled, sso_provider, sso_entrypoint, session_timeout_minutes")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error.message, "tenant_security_policies")) {
      return DEFAULT_TENANT_SECURITY_POLICY;
    }
    throw new Error(`Erro ao carregar política de segurança da empresa: ${error.message}`);
  }

  return {
    mfa_required_roles: Array.isArray(data?.mfa_required_roles)
      ? (data?.mfa_required_roles as string[])
      : DEFAULT_TENANT_SECURITY_POLICY.mfa_required_roles,
    sso_enabled: Boolean(data?.sso_enabled ?? DEFAULT_TENANT_SECURITY_POLICY.sso_enabled),
    sso_provider: String(data?.sso_provider ?? DEFAULT_TENANT_SECURITY_POLICY.sso_provider),
    sso_entrypoint: String(data?.sso_entrypoint ?? DEFAULT_TENANT_SECURITY_POLICY.sso_entrypoint),
    session_timeout_minutes: Number(
      data?.session_timeout_minutes ?? DEFAULT_TENANT_SECURITY_POLICY.session_timeout_minutes,
    ),
  };
}

export async function createTenantAuthSession(input: {
  empresaId: string;
  profileId: string;
  deviceLabel: string;
  userAgent: string;
  ip: string | null;
}) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tenant_auth_sessions")
    .insert({
      empresa_id: input.empresaId,
      profile_id: input.profileId,
      device_label: input.deviceLabel,
      user_agent: input.userAgent,
      ip_hash: hashIp(input.ip),
      last_seen_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingTable(error.message, "tenant_auth_sessions")) {
      return null;
    }
    throw new Error(`Erro ao criar sessão de autenticação: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Erro ao criar sessão de autenticação: sem id retornado");
  }
  return String(data.id);
}

export async function validateAndTouchTenantSession(input: { empresaId: string; sessionId: string }) {
  const supabase = await createServerClient();
  const [policy, sessionQuery] = await Promise.all([
    getTenantSecurityPolicyByEmpresa(input.empresaId),
    supabase
      .from("tenant_auth_sessions")
      .select("id, last_seen_at, revoked_at")
      .eq("empresa_id", input.empresaId)
      .eq("id", input.sessionId)
      .maybeSingle(),
  ]);

  if (sessionQuery.error) {
    if (isMissingTable(sessionQuery.error.message, "tenant_auth_sessions")) {
      return { valid: true };
    }
    throw new Error(`Erro ao validar sessão atual: ${sessionQuery.error.message}`);
  }
  if (!sessionQuery.data || sessionQuery.data.revoked_at) {
    return { valid: false };
  }

  const timeoutMs = Math.max(policy.session_timeout_minutes, 15) * 60 * 1000;
  const lastSeenMs = new Date(String(sessionQuery.data.last_seen_at ?? "")).getTime();
  if (!Number.isFinite(lastSeenMs) || Date.now() - lastSeenMs > timeoutMs) {
    const expire = await supabase
      .from("tenant_auth_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("empresa_id", input.empresaId)
      .eq("id", input.sessionId);
    if (expire.error) {
      if (isMissingTable(expire.error.message, "tenant_auth_sessions")) {
        return { valid: true };
      }
      throw new Error(`Erro ao expirar sessão por timeout: ${expire.error.message}`);
    }
    return { valid: false };
  }

  const touch = await supabase
    .from("tenant_auth_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("empresa_id", input.empresaId)
    .eq("id", input.sessionId);

  if (touch.error) {
    if (isMissingTable(touch.error.message, "tenant_auth_sessions")) {
      return { valid: true };
    }
    throw new Error(`Erro ao atualizar atividade da sessão: ${touch.error.message}`);
  }

  return { valid: true };
}
