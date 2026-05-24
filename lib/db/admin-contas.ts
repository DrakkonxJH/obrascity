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
  status: "open" | "in_progress" | "resolved" | "ignored";
  reason: string;
  email: string | null;
  ip_hash: string | null;
  resolved_at: string | null;
  resolved_by_profile_id: string | null;
  resolution_note: string | null;
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

export type AdminSupportTicket = {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  owner_profile_id: string | null;
  owner_nome: string | null;
  sla_deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type MasterAuditLog = {
  id: string;
  actor_profile_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  empresa_id: string | null;
  empresa_nome: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

type AssinaturaRow = {
  empresa_id: string;
  id: string;
  plano: string;
  status: string;
  periodo_fim: string | null;
  created_at: string;
};

const ALERT_STATUSES = new Set(["open", "in_progress", "resolved", "ignored"]);

function pickCurrentSubscription(rows: AssinaturaRow[]) {
  const activeRows = rows.filter((row) => ["active", "trialing"].includes(String(row.status).toLowerCase()));
  const source = activeRows.length > 0 ? activeRows : rows;
  return source[0] ?? null;
}

export async function listAllEmpresas(): Promise<AdminEmpresa[]> {
  const admin = createAdminClient();

  const [empresasRes, assinaturasRes, profilesRes] = await Promise.all([
    admin.from("empresas").select("id, nome, created_at").order("created_at", { ascending: false }),
    admin
      .from("assinaturas")
      .select("empresa_id, id, plano, status, periodo_fim, created_at")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("empresa_id"),
  ]);

  if (empresasRes.error) throw new Error(empresasRes.error.message);

  const assinMap = new Map<string, AssinaturaRow[]>();
  for (const a of assinaturasRes.data ?? []) {
    const list = assinMap.get(a.empresa_id) ?? [];
    list.push({
      empresa_id: a.empresa_id,
      id: a.id,
      plano: a.plano,
      status: a.status,
      periodo_fim: a.periodo_fim ?? null,
      created_at: a.created_at ?? "",
    });
    assinMap.set(a.empresa_id, list);
  }

  const profileCountMap = new Map<string, number>();
  for (const p of profilesRes.data ?? []) {
    if (String((p as { role?: string }).role ?? "").toLowerCase() === "master") continue;
    profileCountMap.set(p.empresa_id, (profileCountMap.get(p.empresa_id) ?? 0) + 1);
  }

  return (empresasRes.data ?? []).map((e) => {
    const assinatura = pickCurrentSubscription(assinMap.get(e.id) ?? []);
    return {
      id: e.id,
      nome: e.nome,
      created_at: e.created_at,
      plano: assinatura?.plano ?? "trial",
      assinatura_status: assinatura?.status ?? "trial",
      assinatura_id: assinatura?.id ?? null,
      periodo_fim: assinatura?.periodo_fim ?? null,
      profile_count: profileCountMap.get(e.id) ?? 0,
    };
  });
}

export async function listAllProfiles(): Promise<AdminProfile[]> {
  const admin = createAdminClient();

  const [profilesRes, empresasRes, authRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, nome, email, role, cargo, empresa_id, created_at")
      .neq("role", "master")
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

  return (profilesRes.data ?? []).map((p) => {
    return {
      id: p.id,
      nome: p.nome,
      email: p.email,
      role: p.role,
      cargo: p.cargo ?? null,
      empresa_id: p.empresa_id,
      empresa_nome: empresaMap.get(p.empresa_id) ?? "—",
      created_at: p.created_at,
      last_sign_in_at: authMap.get(p.id) ?? null,
    };
  });
}

export async function listRecentSecurityAlerts(limit = 50): Promise<AdminSecurityAlert[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("security_alerts")
    .select("id, category, severity, reason, email, ip_hash, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>;
    const rawStatus = String(metadata.remediation_status ?? "open").toLowerCase();
    const status = ALERT_STATUSES.has(rawStatus) ? rawStatus : "open";
    return {
      ...item,
      status: status as AdminSecurityAlert["status"],
      resolved_at: metadata.remediation_resolved_at ? String(metadata.remediation_resolved_at) : null,
      resolved_by_profile_id: metadata.remediation_resolved_by_profile_id
        ? String(metadata.remediation_resolved_by_profile_id)
        : null,
      resolution_note: metadata.remediation_note ? String(metadata.remediation_note) : null,
      metadata,
    };
  }) as AdminSecurityAlert[];
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

export async function listSupportTickets(limit = 100): Promise<AdminSupportTicket[]> {
  const admin = createAdminClient();
  const [ticketsRes, empresasRes, profilesRes] = await Promise.all([
    admin
      .from("support_tickets")
      .select("id, empresa_id, title, category, priority, status, owner_profile_id, sla_deadline, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin.from("empresas").select("id, nome"),
    admin.from("profiles").select("id, nome"),
  ]);

  if (ticketsRes.error) throw new Error(ticketsRes.error.message);

  const empresaMap = new Map<string, string>();
  for (const e of empresasRes.data ?? []) {
    empresaMap.set(e.id, e.nome);
  }

  const profileMap = new Map<string, string>();
  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.id, p.nome);
  }

  return (ticketsRes.data ?? []).map((item) => ({
    id: item.id,
    empresa_id: item.empresa_id,
    empresa_nome: empresaMap.get(item.empresa_id) ?? "—",
    title: item.title,
    category: item.category,
    priority: item.priority,
    status: item.status,
    owner_profile_id: item.owner_profile_id ?? null,
    owner_nome: item.owner_profile_id ? profileMap.get(item.owner_profile_id) ?? null : null,
    sla_deadline: item.sla_deadline ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function listMasterAuditLogs(limit = 120): Promise<MasterAuditLog[]> {
  const admin = createAdminClient();
  const [logsRes, empresasRes] = await Promise.all([
    admin
      .from("master_audit_logs")
      .select("id, actor_profile_id, actor_email, action, target_type, target_id, empresa_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin.from("empresas").select("id, nome"),
  ]);

  if (logsRes.error) throw new Error(logsRes.error.message);

  const empresaMap = new Map<string, string>();
  for (const e of empresasRes.data ?? []) {
    empresaMap.set(e.id, e.nome);
  }

  return (logsRes.data ?? []).map((log) => ({
    id: log.id,
    actor_profile_id: log.actor_profile_id ?? null,
    actor_email: log.actor_email ?? null,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id ?? null,
    empresa_id: log.empresa_id ?? null,
    empresa_nome: log.empresa_id ? empresaMap.get(log.empresa_id) ?? null : null,
    details: (log.details ?? {}) as Record<string, unknown>,
    created_at: log.created_at,
  }));
}
