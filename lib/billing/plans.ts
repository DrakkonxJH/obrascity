export type PlanId = "trial" | "starter" | "pro" | "enterprise";

export const PLAN_PROFILE_LIMIT: Record<PlanId, number> = {
  trial: 10,
  starter: 10,
  pro: 30,
  enterprise: 80,
};

export type PlanFeature =
  | "dashboard"
  | "obras_basic"
  | "equipes_basic"
  | "materiais_basic"
  | "cronograma"
  | "qualidade_basic"
  | "relatórios_basic"
  | "relatórios_export"
  | "relatórios_agendados"
  | "notificacoes_alertas"
  | "controle_acesso_avancado"
  | "financeiro_avancado"
  | "integração_whatsapp"
  | "integração_sheets"
  | "integração_zapier"
  | "automacoes_workflow"
  | "gestão_documentos"
  | "comunicação_integrada"
  | "segurança_enterprise"
  | "api_access";

const PLAN_FEATURES: Record<PlanId, readonly PlanFeature[]> = {
  trial: [
    "dashboard",
    "obras_basic",
    "equipes_basic",
    "materiais_basic",
    "cronograma",
    "qualidade_basic",
    "relatórios_basic",
    "relatórios_export",
    "relatórios_agendados",
    "notificacoes_alertas",
    "controle_acesso_avancado",
    "financeiro_avancado",
    "integração_whatsapp",
    "integração_sheets",
    "integração_zapier",
    "automacoes_workflow",
    "gestão_documentos",
    "comunicação_integrada",
    "segurança_enterprise",
    "api_access",
  ],
  starter: [
    "dashboard",
    "obras_basic",
    "equipes_basic",
    "materiais_basic",
    "cronograma",
    "financeiro_avancado",
  ],
  pro: [
    "dashboard",
    "obras_basic",
    "equipes_basic",
    "materiais_basic",
    "cronograma",
    "qualidade_basic",
    "relatórios_basic",
    "relatórios_export",
    "relatórios_agendados",
    "notificacoes_alertas",
    "controle_acesso_avancado",
    "financeiro_avancado",
    "integração_whatsapp",
    "integração_sheets",
    "integração_zapier",
    "automacoes_workflow",
    "gestão_documentos",
    "comunicação_integrada",
    "segurança_enterprise",
    "api_access",
  ],
  enterprise: [
    "dashboard",
    "obras_basic",
    "equipes_basic",
    "materiais_basic",
    "cronograma",
    "qualidade_basic",
    "relatórios_basic",
    "relatórios_export",
    "relatórios_agendados",
    "notificacoes_alertas",
    "controle_acesso_avancado",
    "financeiro_avancado",
    "integração_whatsapp",
    "integração_sheets",
    "integração_zapier",
    "automacoes_workflow",
    "gestão_documentos",
    "comunicação_integrada",
    "segurança_enterprise",
    "api_access",
  ],
};

const ACTIVE_STATUSES = new Set(["trial", "trialing", "active"]);

export type SubscriptionSnapshot = {
  plano: PlanId;
  status: string;
  periodo_fim: string | null;
};

export function planIncludes(plano: string, feature: PlanFeature) {
  const features = PLAN_FEATURES[plano as PlanId];
  return features?.includes(feature) ?? false;
}

export function subscriptionAllows(
  subscription: SubscriptionSnapshot | null,
  feature: PlanFeature,
) {
  if (!subscription) return false;
  if (!ACTIVE_STATUSES.has(subscription.status)) return false;

  if (subscription.periodo_fim) {
    const endsAt = new Date(subscription.periodo_fim).getTime();
    if (!Number.isNaN(endsAt) && endsAt <= Date.now()) {
      return false;
    }
  }

  return planIncludes(subscription.plano, feature);
}

export function assertSubscriptionFeature(
  subscription: SubscriptionSnapshot | null,
  feature: PlanFeature,
  message?: string,
) {
  if (!subscriptionAllows(subscription, feature)) {
    throw new Error(
      message ?? "Recurso disponivel em planos superiores. Faca upgrade para continuar.",
    );
  }
}

export function getProfileLimitByPlan(plan: string | null | undefined): number {
  if (!plan) return PLAN_PROFILE_LIMIT.trial;
  const normalized = String(plan).trim().toLowerCase() as PlanId;
  return PLAN_PROFILE_LIMIT[normalized] ?? PLAN_PROFILE_LIMIT.trial;
}
