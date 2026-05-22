import { createAdminClient } from "@/lib/supabase/admin";

export type AdminEmpresa = {
  id: string;
  nome: string;
  created_at: string;
  plano: string;
  assinatura_status: string;
  assinatura_id: string | null;
  periodo_fim: string | null;
  profile_count: number;
};

export type AdminProfile = {
  id: string;
  nome: string;
  email: string;
  role: string;
  cargo: string | null;
  empresa_id: string;
  empresa_nome: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdminSecurityAlert = {
  id: string;
  category: string;
  severity: string;
  reason: string;
  email: string | null;
  ip_hash: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type AdminSignupAttempt = {
  id: string;
  email: string | null;
  ip_hash: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
};

export async function listAllEmpresas(): Promise<AdminEmpresa[]> {
  const admin = createAdminClient();

  const [empresasRes, assinaturasRes, profilesRes] = await Promise.all([
    admin.from("empresas").select("id, nome, created_at").order("created_at", { ascending: false }),
    admin.from("assinaturas").select("empresa_id, id, plano, status, periodo_fim"),
    admin.from("profiles").select("empresa_id"),
  ]);

  if (empresasRes.error) throw new Error(empresasRes.error.message);

  const assinMap = new Map<string, { id: string; plano: string; status: string; periodo_fim: string | null }>();
  for (const a of assinaturasRes.data ?? []) {
    if (!assinMap.has(a.empresa_id)) {
      assinMap.set(a.empresa_id, {
        id: a.id,
        plano: a.plano,
        status: a.status,
        periodo_fim: a.periodo_fim ?? null,
      });
    }
  }

  const profileCountMap = new Map<string, number>();
  for (const p of profilesRes.data ?? []) {
    profileCountMap.set(p.empresa_id, (profileCountMap.get(p.empresa_id) ?? 0) + 1);
  }

  return (empresasRes.data ?? []).map((e) => ({
    id: e.id,
    nome: e.nome,
    created_at: e.created_at,
    plano: assinMap.get(e.id)?.plano ?? "trial",
    assinatura_status: assinMap.get(e.id)?.status ?? "trial",
    assinatura_id: assinMap.get(e.id)?.id ?? null,
    periodo_fim: assinMap.get(e.id)?.periodo_fim ?? null,
    profile_count: profileCountMap.get(e.id) ?? 0,
  }));
}

export async function listAllProfiles(): Promise<AdminProfile[]> {
  const admin = createAdminClient();

  const [profilesRes, empresasRes, authRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, nome, email, role, cargo, empresa_id, created_at")
      .order("created_at", { ascending: false }),
    admin.from("empresas").select("id, nome"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const empresaMap = new Map<string, string>();
  for (const e of empresasRes.data ?? []) {
    empresaMap.set(e.id, e.nome);
  }

  const authMap = new Map<string, string | null>();
  for (const u of authRes.data?.users ?? []) {
    authMap.set(u.id, u.last_sign_in_at ?? null);
  }

  return (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    role: p.role,
    cargo: p.cargo ?? null,
    empresa_id: p.empresa_id,
    empresa_nome: empresaMap.get(p.empresa_id) ?? "—",
    created_at: p.created_at,
    last_sign_in_at: authMap.get(p.id) ?? null,
  }));
}

export async function listRecentSecurityAlerts(limit = 50): Promise<AdminSecurityAlert[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("security_alerts")
    .select("id, category, severity, reason, email, ip_hash, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminSecurityAlert[];
}

export async function listRecentSignupAttempts(limit = 30): Promise<AdminSignupAttempt[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("signup_attempts")
    .select("id, email, ip_hash, success, failure_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminSignupAttempt[];
}
