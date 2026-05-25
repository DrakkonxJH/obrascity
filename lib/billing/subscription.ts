import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import type { PlanId, SubscriptionSnapshot } from "@/lib/billing/plans";

type AssinaturaRow = {
  plano: string;
  status: string;
  periodo_fim: string | null;
  created_at: string;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "trial"]);
const GRACE_STATUSES = new Set(["canceled", "cancelada"]);

function isActiveInPeriod(status: string, periodEnd: string | null) {
  const normalized = status.trim().toLowerCase();
  if (!ACTIVE_STATUSES.has(normalized) && !GRACE_STATUSES.has(normalized)) {
    return false;
  }
  if (!periodEnd) {
    return ACTIVE_STATUSES.has(normalized);
  }
  const endsAt = new Date(periodEnd).getTime();
  if (Number.isNaN(endsAt)) {
    return ACTIVE_STATUSES.has(normalized);
  }
  return endsAt > Date.now();
}

function normalizePlan(value: string | null | undefined): PlanId {
  const normalized = String(value ?? "trial").trim().toLowerCase();
  if (normalized === "starter" || normalized === "pro" || normalized === "enterprise" || normalized === "trial") {
    return normalized;
  }
  return "trial";
}

function pickCurrentSubscription(rows: AssinaturaRow[]): AssinaturaRow | null {
  const active = rows.find((row) => isActiveInPeriod(row.status, row.periodo_fim));
  if (active) return active;
  return rows[0] ?? null;
}

export async function getSubscriptionForCurrentTenant(): Promise<SubscriptionSnapshot | null> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("assinaturas")
    .select("plano, status, periodo_fim, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Erro ao carregar assinatura: ${error.message}`);
  }

  const rows = (data ?? []) as AssinaturaRow[];
  const current = pickCurrentSubscription(rows);

  if (!current) {
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("plano")
      .eq("id", empresaId)
      .maybeSingle();
    if (empresaError) {
      throw new Error(`Erro ao carregar plano da empresa: ${empresaError.message}`);
    }
    return {
      plano: normalizePlan((empresa?.plano as string | null) ?? "trial"),
      status: "trialing",
      periodo_fim: null,
    };
  }

  return {
    plano: normalizePlan(current.plano),
    status: String(current.status ?? ""),
    periodo_fim: current.periodo_fim ?? null,
  };
}
