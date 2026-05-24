import { PlanFeature, SubscriptionSnapshot, subscriptionAllows } from "./plans";

export type FeatureAccessLevel = "allowed" | "upgrade_required" | "enterprise_only";

export interface FeatureAccessStatus {
  level: FeatureAccessLevel;
  currentPlan: string;
  requiredPlan: string;
  message: string;
}

// Map cada feature para seu plano mínimo requerido
const FEATURE_MIN_PLAN: Record<PlanFeature, "starter" | "pro" | "enterprise"> = {
  dashboard: "starter",
  obras_basic: "starter",
  equipes_basic: "starter",
  materiais_basic: "starter",
  cronograma: "pro",
  relatórios_basic: "starter",
  relatórios_export: "pro",
  relatórios_agendados: "pro",
  notificacoes_alertas: "pro",
  controle_acesso_avancado: "pro",
  financeiro_avancado: "pro",
  integração_whatsapp: "pro",
  integração_sheets: "pro",
  integração_zapier: "pro",
  automacoes_workflow: "pro",
  gestão_documentos: "pro",
  comunicação_integrada: "pro",
  segurança_enterprise: "pro",
  api_access: "pro",
};

export function checkFeatureAccess(
  subscription: SubscriptionSnapshot | null,
  feature: PlanFeature,
): FeatureAccessStatus {
  const currentPlan = subscription?.plano ?? "trial";
  const requiredPlan = FEATURE_MIN_PLAN[feature];

  const hasAccess = subscriptionAllows(subscription, feature);

  if (hasAccess) {
    return {
      level: "allowed",
      currentPlan,
      requiredPlan,
      message: "Acesso permitido",
    };
  }

  const planLabels: Record<string, string> = {
    trial: "Trial",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return {
    level: "upgrade_required",
    currentPlan,
    requiredPlan,
    message: `Este recurso está disponível a partir do plano ${planLabels[requiredPlan]}. Faça upgrade para continuar.`,
  };
}

export function getFeatureName(feature: PlanFeature): string {
  const names: Record<PlanFeature, string> = {
    dashboard: "Dashboard",
    obras_basic: "Obras Básicas",
    equipes_basic: "Equipes Básicas",
    materiais_basic: "Materiais Básicos",
    cronograma: "Cronograma",
    relatórios_basic: "Relatórios Básicos",
    relatórios_export: "Exportar Relatórios",
    relatórios_agendados: "Relatórios Agendados",
    notificacoes_alertas: "Notificações e Alertas",
    controle_acesso_avancado: "Controle de Acesso Avançado",
    financeiro_avancado: "Financeiro Avançado",
    integração_whatsapp: "Integração WhatsApp",
    integração_sheets: "Integração Google Sheets",
    integração_zapier: "Integração Zapier",
    automacoes_workflow: "Automações de Workflow",
    gestão_documentos: "Gestão de Documentos",
    comunicação_integrada: "Comunicação Integrada",
    segurança_enterprise: "Segurança Enterprise",
    api_access: "Acesso à API",
  };
  return names[feature] ?? feature;
}
