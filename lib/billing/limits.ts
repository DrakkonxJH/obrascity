import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";
import { getProfileLimitByPlan } from "@/lib/billing/plans";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";

const PLAN_REPORT_DAILY_LIMIT: Record<string, number> = {
  trial: 20,
  starter: 50,
  pro: 150,
  enterprise: 500,
};

function normalizePlan(plan: string | null | undefined) {
  return String(plan ?? "trial").trim().toLowerCase();
}

export async function assertProfileLimitAvailable() {
  const [empresaId, subscription] = await Promise.all([
    getEmpresaIdFromProfile(),
    getSubscriptionForCurrentTenant(),
  ]);
  const supabase = await createServerClient();
  const plan = normalizePlan(subscription?.plano);
  const limit = getProfileLimitByPlan(plan);

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .eq("empresa_id", empresaId)
    .neq("role", "master");

  if (error) {
    throw new Error(`Não foi possível validar limite de perfis: ${error.message}`);
  }

  const current = count ?? 0;
  if (current >= limit) {
    throw new Error(
      `Limite de usuários atingido para o plano ${plan}. Atual: ${current}/${limit}.`,
    );
  }
}

export async function assertReportRequestLimitAvailable() {
  const [empresaId, subscription] = await Promise.all([
    getEmpresaIdFromProfile(),
    getSubscriptionForCurrentTenant(),
  ]);
  const supabase = await createServerClient();

  const plan = normalizePlan(subscription?.plano);
  const dailyLimit = PLAN_REPORT_DAILY_LIMIT[plan] ?? PLAN_REPORT_DAILY_LIMIT.trial;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("relatorios")
    .select("id", { head: true, count: "exact" })
    .eq("empresa_id", empresaId)
    .gte("created_at", since);

  if (error) {
    throw new Error(`Não foi possível validar limite de relatórios: ${error.message}`);
  }

  const used = count ?? 0;
  if (used >= dailyLimit) {
    throw new Error(
      `Limite diário de relatórios atingido (${used}/${dailyLimit}) no plano ${plan}.`,
    );
  }
}
