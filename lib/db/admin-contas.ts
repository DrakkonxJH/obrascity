import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingRelation } from "@/lib/db/migration-guard";

export type AdminEmpresa = {
  id: string;
  nome: string;
  created_at: string;
  plano: string;
  assinatura_status: string;
  assinatura_id: string | null;
  periodo_fim: string | null;
  profile_count: number;
  obra_count: number;
  active_obra_count: number;
  last_activity_at: string | null;
  storage_estimate_mb: number;
  profile_limit_override: number | null;
  report_daily_limit_override: number | null;
  feature_flag_count: number;
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

type PageResult<Row> = {
  data: Row[] | null;
  error: { message?: string } | null;
};

async function fetchAllPages<Row>(
  buildPage: (from: number, to: number) => PromiseLike<PageResult<Row>> | PageResult<Row>,
  pageSize = 500,
) {
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const result = await buildPage(from, to);
    if (result.error) {
      if (isMissingRelation(result.error.message ?? "")) {
        return rows;
      }
      throw new Error(result.error.message ?? "Erro ao carregar dados administrativos");
    }
    const pageRows = (result.data ?? []) as Row[];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) {
      break;
    }
  }
  return rows;
}

function pickCurrentSubscription(rows: AssinaturaRow[]) {
  const activeRows = rows.filter((row) => ["active", "trialing"].includes(String(row.status).toLowerCase()));
  const source = activeRows.length > 0 ? activeRows : rows;
  return source[0] ?? null;
}

export async function listAllEmpresas(): Promise<AdminEmpresa[]> {
  const admin = createAdminClient();

  const [empresas, assinaturas, profiles, obras, fotos, relatorios, diarios, sessions, overrides, flags] =
    await Promise.all([
      fetchAllPages((from, to) =>
        admin.from("empresas").select("id, nome, created_at").order("created_at", { ascending: false }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin
          .from("assinaturas")
          .select("empresa_id, id, plano, status, periodo_fim, created_at")
          .order("created_at", { ascending: false })
          .range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("profiles").select("empresa_id, role").order("empresa_id", { ascending: true }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("obras").select("empresa_id, status, created_at").order("created_at", { ascending: false }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("fotos_obra").select("empresa_id, created_at").order("created_at", { ascending: false }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("relatorios").select("empresa_id, created_at").order("created_at", { ascending: false }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("diario_obra").select("empresa_id, created_at").order("created_at", { ascending: false }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("tenant_auth_sessions").select("empresa_id, last_seen_at").order("last_seen_at", { ascending: false }).range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin
          .from("tenant_admin_overrides")
          .select("empresa_id, profile_limit_override, report_daily_limit_override")
          .order("updated_at", { ascending: false })
          .range(from, to),
      ),
      fetchAllPages((from, to) =>
        admin.from("tenant_feature_flags").select("empresa_id").order("updated_at", { ascending: false }).range(from, to),
      ),
    ]);

  const assinMap = new Map<string, AssinaturaRow[]>();
  for (const a of assinaturas) {
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
  for (const p of profiles) {
    if (String((p as { role?: string }).role ?? "").toLowerCase() === "master") continue;
    profileCountMap.set(p.empresa_id, (profileCountMap.get(p.empresa_id) ?? 0) + 1);
  }

  const obraCountMap = new Map<string, number>();
  const activeObraCountMap = new Map<string, number>();
  for (const obra of obras) {
    obraCountMap.set(obra.empresa_id, (obraCountMap.get(obra.empresa_id) ?? 0) + 1);
    if (String(obra.status ?? "").toLowerCase() !== "concluida") {
      activeObraCountMap.set(obra.empresa_id, (activeObraCountMap.get(obra.empresa_id) ?? 0) + 1);
    }
  }

  const lastActivityMap = new Map<string, string>();
  for (const session of sessions) {
    const lastSeen = String(session.last_seen_at ?? "");
    const current = lastActivityMap.get(session.empresa_id);
    if (!current || new Date(lastSeen).getTime() > new Date(current).getTime()) {
      lastActivityMap.set(session.empresa_id, lastSeen);
    }
  }
  for (const obra of obras) {
    const updatedAt = String(obra.created_at ?? "");
    const current = lastActivityMap.get(obra.empresa_id);
    if (!current || new Date(updatedAt).getTime() > new Date(current).getTime()) {
      lastActivityMap.set(obra.empresa_id, updatedAt);
    }
  }

  const storageEstimateMap = new Map<string, number>();
  const addEstimate = (empresaId: string, mb: number) => {
    storageEstimateMap.set(empresaId, (storageEstimateMap.get(empresaId) ?? 0) + mb);
  };
  for (const item of fotos) addEstimate(item.empresa_id, 1.8);
  for (const item of relatorios) addEstimate(item.empresa_id, 0.9);
  for (const item of diarios) addEstimate(item.empresa_id, 0.25);

  const overrideMap = new Map<string, { profile_limit_override: number | null; report_daily_limit_override: number | null }>();
  for (const row of overrides) {
    overrideMap.set(row.empresa_id, {
      profile_limit_override: row.profile_limit_override ?? null,
      report_daily_limit_override: row.report_daily_limit_override ?? null,
    });
  }

  const featureFlagCountMap = new Map<string, number>();
  for (const row of flags) {
    featureFlagCountMap.set(row.empresa_id, (featureFlagCountMap.get(row.empresa_id) ?? 0) + 1);
  }

  return empresas.map((e) => {
    const assinatura = pickCurrentSubscription(assinMap.get(e.id) ?? []);
    const override = overrideMap.get(e.id);
    return {
      id: e.id,
      nome: e.nome,
      created_at: e.created_at,
      plano: assinatura?.plano ?? "trial",
      assinatura_status: assinatura?.status ?? "trial",
      assinatura_id: assinatura?.id ?? null,
      periodo_fim: assinatura?.periodo_fim ?? null,
      profile_count: profileCountMap.get(e.id) ?? 0,
      obra_count: obraCountMap.get(e.id) ?? 0,
      active_obra_count: activeObraCountMap.get(e.id) ?? 0,
      last_activity_at: lastActivityMap.get(e.id) ?? null,
      storage_estimate_mb: Number((storageEstimateMap.get(e.id) ?? 0).toFixed(2)),
      profile_limit_override: override?.profile_limit_override ?? null,
      report_daily_limit_override: override?.report_daily_limit_override ?? null,
      feature_flag_count: featureFlagCountMap.get(e.id) ?? 0,
    };
  });
}

export async function listAllProfiles(): Promise<AdminProfile[]> {
  const admin = createAdminClient();

  const [profiles, empresas] = await Promise.all([
    fetchAllPages((from, to) =>
      admin
        .from("profiles")
        .select("id, nome, email, role, cargo, empresa_id, created_at")
        .neq("role", "master")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    fetchAllPages((from, to) => admin.from("empresas").select("id, nome").order("created_at", { ascending: false }).range(from, to)),
  ]);

  const authUsers = [];
  const pageSize = 1000;
  for (let page = 1; ; page += 1) {
    const authRes = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (authRes.error) throw new Error(authRes.error.message);
    authUsers.push(...(authRes.data?.users ?? []));
    if ((authRes.data?.users ?? []).length < pageSize) {
      break;
    }
  }

  const empresaMap = new Map<string, string>();
  for (const e of empresas) {
    empresaMap.set(e.id, e.nome);
  }

  const authMap = new Map<string, string | null>();
  for (const u of authUsers) {
    authMap.set(u.id, u.last_sign_in_at ?? null);
  }

  return profiles.map((p) => {
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
