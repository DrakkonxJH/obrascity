import { getCurrentProfile } from "@/lib/auth/require-profile";
import type { PlanFeature, PlanId } from "@/lib/billing/plans";
import { getProfileLimitByPlan, planIncludes } from "@/lib/billing/plans";
import Link from "next/link";
import type { BillingCycle } from "@/lib/billing/stripe-price-map";

import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { openBillingPortalAction, startCheckoutAction } from "./actions";
import { GatewayCheckoutForm } from "./gateway-selector";
import { PageHeader } from "@/components/ui/page-header";

const BILLING_ROLES = new Set(["administrador", "gestor"]);

const featureCatalog: Record<PlanFeature, { label: string }> = {
  dashboard: { label: "Dashboard operacional" },
  obras_basic: { label: "Gestão de obras" },
  equipes_basic: { label: "Gestão de equipes" },
  materiais_basic: { label: "Gestão de materiais" },
  cronograma: { label: "Cronograma de obra" },
  qualidade_basic: { label: "Módulo de qualidade" },
  relatórios_basic: { label: "Relatórios básicos" },
  relatórios_export: { label: "Exportacao de relatórios" },
  relatórios_agendados: { label: "Relatórios agendados por email" },
  notificacoes_alertas: { label: "Notificacoes e alertas em tempo real" },
  controle_acesso_avancado: { label: "Controle de acesso avancado" },
  financeiro_avancado: { label: "Financeiro avancado" },
  integração_whatsapp: { label: "Integração WhatsApp" },
  integração_sheets: { label: "Sync com Google Sheets" },
  integração_zapier: { label: "Integração Zapier" },
  automacoes_workflow: { label: "Automacoes com workflow builder" },
  gestão_documentos: { label: "Gestão e OCR de documentos" },
  comunicação_integrada: { label: "Chat integrado por projeto" },
  segurança_enterprise: { label: "SSO/SAML + Suporte 24/7" },
  api_access: { label: "Acesso via API completa" },
};

const planFeatureOrder: PlanFeature[] = [
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
];

const commercialSplit: Array<{
  id: Exclude<PlanId, "trial">;
  label: string;
  focus: string[];
  description: string;
}> = [
  {
    id: "starter",
    label: "Starter",
    focus: ["Obras", "Cronograma", "Equipes", "Materiais", "Viabilidade"],
    description: "Conta da empresa com rotina e poucos perfis.",
  },
  {
    id: "pro",
    label: "Pro",
    focus: [
      "CRM",
      "Projetos",
      "Financeiro",
      "Relatórios",
      "Mudanças",
      "Diário",
      "Qualidade",
      "Entrega",
      "Garantia",
      "Portal do Cliente",
    ],
    description: "Operação completa com mais times e mais perfis.",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    focus: ["Mobile Campo", "API", "Automações", "Integrações", "Governança", "Segurança corporativa"],
    description: "Escala corporativa, governança e integrações avançadas.",
  },
];

const sharedBaseCapabilities = [
  "Conta da empresa",
  "Perfis de usuarios internos",
  "Compartilhamento entre perfis",
  "Permissões por cargo",
  "Limite de perfis por plano",
];

function planLabel(plano: string) {
  switch (plano) {
    case "trial":
      return "Trial (gratis)";
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    default:
      return plano;
  }
}

function statusLabel(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase();
  if (value === "active") return "Ativa";
  if (value === "trialing") return "Em trial";
  if (value === "past_due") return "Pagamento pendente";
  if (value === "pending_payment") return "Aguardando PIX";
  if (value === "canceled" || value === "cancelada") return "Cancelada";
  if (value === "incomplete") return "Incompleta";
  return "Nao configurada";
}

function getBillingProviderLabel(subscriptionRef: string | null | undefined) {
  if ((subscriptionRef ?? "").startsWith("mp_")) return "Mercado Pago";
  if ((subscriptionRef ?? "").startsWith("asaas_")) return "Asaas";
  return "Stripe";
}

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; erro?: string; billing?: string; gateway?: string }>;
}) {
  const params = await searchParams;
  const [assinatura, profile] = await Promise.all([getAssinaturaAtual(), getCurrentProfile()]);
  const canManageBilling = profile ? BILLING_ROLES.has(profile.role as string) : false;
  const billingProvider = getBillingProviderLabel(
    assinatura?.external_subscription_id ?? assinatura?.external_customer_id,
  );

  const currentPlan = (assinatura?.plano ?? "trial") as PlanId;
  const planOrder: Record<PlanId, number> = {
    trial: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
  };
  const currentOrder = planOrder[currentPlan] ?? 0;
  const billingCycle: BillingCycle = params.billing === "monthly" ? "monthly" : "annual";

  const catalog: Array<{
    id: Exclude<PlanId, "trial">;
    name: string;
    monthly: number;
    annual: number;
    blurb: string;
    audience: string;
    profileLimit: number;
    highlight?: boolean;
  }> = [
    {
      id: "starter",
      name: "Starter",
      monthly: 129,
      annual: 90,
      blurb: "Base para organizar a obra e a rotina da operação.",
      audience: "Melhor encaixe: Obras, Cronograma, Equipes, Materiais e Viabilidade.",
      profileLimit: getProfileLimitByPlan("starter"),
    },
    {
      id: "pro",
      name: "Pro",
      monthly: 229,
      annual: 159,
      blurb: "Central de gestão para escalar a operação.",
      audience:
        "Melhor encaixe: CRM, Projetos, Financeiro, Relatórios, Mudanças, Diário, Qualidade, Entrega, Garantia e Portal do Cliente.",
      profileLimit: getProfileLimitByPlan("pro"),
      highlight: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthly: 799,
      annual: 549,
      blurb: "Escala, integração e governança para operações complexas.",
      audience:
        "Melhor encaixe: Mobile Campo, API, automações, integrações, governança e segurança corporativa.",
      profileLimit: getProfileLimitByPlan("enterprise"),
    },
  ];

  const checkoutMessage =
    params.checkout === "success"
      ? {
          kind: "success" as const,
          text:
            params.gateway === "mp" || params.gateway === "asaas"
              ? "Assinatura iniciada. Confirme o PIX para ativar o plano; a atualização ocorre automaticamente após o webhook."
              : "Pagamento processado. Seu plano sera atualizado em instantes.",
        }
      : params.checkout === "cancel"
        ? { kind: "info" as const, text: "Checkout cancelado. Nenhuma cobranca foi feita." }
        : null;

  const errorMessage = params.erro?.trim() ? decodeURIComponent(params.erro) : null;

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Comercial"
        title="Planos e assinatura"
        subtitle="Organize a assinatura da empresa e evolua o plano conforme a operacao cresce."
        actions={
          <>
            <span className="of-badge of-badge-blue">{planLabel(currentPlan)}</span>
            <span className="of-badge of-badge-green">{statusLabel(assinatura?.status)}</span>
          </>
        }
      />

      <article className="of-card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p className="of-list-description" style={{ marginBottom: 4 }}>
              Ciclo atual: <strong>{billingCycle === "annual" ? "Anual" : "Mensal"}</strong>
            </p>
            <p className="of-list-description">
              Gateway ativo: <strong>{billingProvider}</strong>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/planos?billing=monthly" className={billingCycle === "monthly" ? "of-btn-primary" : "of-btn-ghost"}>
              Mensal
            </Link>
            <Link href="/planos?billing=annual" className={billingCycle === "annual" ? "of-btn-primary" : "of-btn-ghost"}>
              Anual
            </Link>
            {canManageBilling && billingProvider === "Stripe" ? (
              <form action={openBillingPortalAction}>
                <button type="submit" className="of-btn-ghost">Portal de cobrança</button>
              </form>
            ) : null}
          </div>
        </div>
      </article>

      {errorMessage ? (
        <p className="mb-6 rounded-md border border-[#ff4060]/40 bg-[#ff4060]/10 px-3 py-2 text-sm text-[#ff9aad]">
          {errorMessage}
        </p>
      ) : null}

      {checkoutMessage ? (
        <p
          className="mb-6 rounded-md border px-3 py-2 text-sm"
          style={
            checkoutMessage.kind === "success"
              ? { borderColor: "rgba(255, 107, 26, 0.4)", background: "rgba(255, 107, 26, 0.1)" }
              : { borderColor: "rgba(136, 150, 179, 0.4)", background: "rgba(136, 150, 179, 0.08)" }
          }
        >
          {checkoutMessage.text}
        </p>
      ) : null}

      <div className="of-kpi-grid" style={{ marginBottom: 18 }}>
        <article className="of-metric-card blue">
          <p className="of-kpi-label">Plano atual</p>
          <p className="of-kpi-value of-plan-kpi-value" style={{ color: "var(--of-blue)" }}>
            {planLabel(currentPlan)}
          </p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">Status da assinatura</p>
          <p className="of-kpi-value of-plan-kpi-value" style={{ color: "var(--of-green)" }}>
            {statusLabel(assinatura?.status)}
          </p>
          {assinatura?.periodo_fim ? (
            <p className="of-list-description">
              Renova/termina em {new Date(assinatura.periodo_fim).toLocaleDateString("pt-BR")}
            </p>
          ) : null}
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-label">Permissão de cobrança</p>
          <p className="of-kpi-value of-plan-kpi-value" style={{ color: "var(--of-yellow)" }}>
            {canManageBilling ? "Habilitada" : "Restrita"}
          </p>
          <p className="of-list-description">
            {canManageBilling
              ? `Voce pode iniciar checkout e gerenciar a cobrança atual via ${billingProvider}.`
              : "Somente administrador/gestor altera plano."}
          </p>
        </article>
      </div>

      <div className="of-card" style={{ marginBottom: 28 }}>
        <div className="of-card-title">Base comum em todos os planos</div>
        <p className="of-list-description" style={{ marginBottom: 14 }}>
          Todo plano parte da conta da empresa. O que muda entre Starter, Pro e Enterprise é o
          limite de perfis, a escala da operação e os controles avançados.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sharedBaseCapabilities.map((item) => (
            <span
              key={item}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(255, 107, 26, 0.1)",
                border: "1px solid rgba(255, 107, 26, 0.22)",
                color: "var(--of-text-primary)",
                fontSize: "0.8rem",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="of-card" style={{ marginBottom: 28 }}>
        <div className="of-card-title">Separação comercial sugerida</div>
        <div className="of-dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }}>
          {commercialSplit.map((plan) => (
            <article
              key={plan.id}
              style={{
                border: "1px solid var(--of-border)",
                borderRadius: 12,
                padding: 18,
                background: "var(--of-bg-3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--of-blue)" }}>
                  {plan.label}
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--of-text-secondary)" }}>{plan.description}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {plan.focus.map((item) => (
                  <span
                    key={`${plan.id}-${item}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(255, 107, 26, 0.1)",
                      border: "1px solid rgba(255, 107, 26, 0.22)",
                      color: "var(--of-text-primary)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8, color: "var(--of-blue)" }}>
            Escolha seu plano
          </h2>
        </div>

        {billingCycle === "annual" && (
          <span
            style={{
              display: "inline-flex",
              marginBottom: 28,
              padding: "4px 12px",
              background: "rgba(255, 107, 26, 0.15)",
              color: "#ff6b1a",
              borderRadius: 4,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            -30% OFF
          </span>
        )}
        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            border: "1px solid rgba(255, 107, 26, 0.32)",
            background: "rgba(255, 107, 26, 0.08)",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--of-text-1)", fontWeight: 600 }}>
            Oferta especial de entrada: 20% OFF por 3 meses nos planos Pro e Enterprise.
          </p>
          <p className="of-list-description" style={{ marginTop: 6 }}>
            Escale sua operacao com previsibilidade de custo e condicoes comerciais diferenciadas
            para novos contratos.
          </p>
        </div>

        <div
          className="of-dashboard-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 20 }}
        >
          {catalog.map((item) => {
            
            const itemOrder = planOrder[item.id] ?? 0;
            const isActiveSubscription = assinatura?.status === "active" || assinatura?.status === "trialing";
            const isCurrent = currentPlan === item.id && isActiveSubscription;
            const isUpgrade = itemOrder > currentOrder;
            const shownPrice = billingCycle === "monthly" ? item.monthly : item.annual;

            return (
              <article
                key={item.id}
                className="of-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  position: "relative",
                  border: item.highlight
                    ? "2px solid rgba(255, 107, 26, 0.45)"
                    : "1px solid var(--of-border)",
                  background: item.highlight ? "rgba(255, 107, 26, 0.03)" : "var(--of-bg-2)",
                  boxShadow: item.highlight
                    ? "0 8px 24px rgba(255, 107, 26, 0.15)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                  padding: "24px",
                }}
              >
                {item.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#ff6b1a",
                      color: "#fff",
                      padding: "4px 16px",
                      borderRadius: 999,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    MAIS POPULAR
                  </div>
                )}

                <div>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--of-blue)",
                      marginBottom: 12,
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "3rem",
                      fontWeight: 800,
                      fontFamily: "Syne, DM Sans, sans-serif",
                      color: item.highlight ? "#ff6b1a" : "var(--of-blue)",
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    R$ {shownPrice}
                  </p>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--of-text-secondary)",
                      marginBottom: 12,
                    }}
                  >
                    {billingCycle === "annual"
                      ? "por mês · cobrado anualmente"
                      : "por mês · cobrado mensalmente"}
                  </p>
                  <p className="of-list-description" style={{ marginBottom: 4 }}>
                    {item.blurb}
                  </p>
                  <p className="of-list-description" style={{ marginBottom: 4 }}>
                    Até {item.profileLimit} perfis por empresa.
                  </p>
                  <p className="of-list-description">{item.audience}</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    minHeight: 48,
                    justifyContent: "flex-start",
                  }}
                >
                  {isCurrent ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(112, 187, 129, 0.12)",
                        color: "#70bb81",
                        borderRadius: 6,
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Seu plano atual
                    </div>
                  ) : !isUpgrade ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(136, 150, 179, 0.12)",
                        color: "var(--of-text-secondary)",
                        borderRadius: 6,
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Voce ja tem um plano superior
                    </div>
                  ) : !canManageBilling ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(136, 150, 179, 0.12)",
                        color: "var(--of-text-secondary)",
                        borderRadius: 6,
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Sem permissao de cobrança
                    </div>
                  ) : (
                    <GatewayCheckoutForm
                      plan={item.id}
                      billingCycle={billingCycle}
                      planName={item.name}
                      currentPlan={currentPlan}
                      isUpgrade={currentPlan !== "trial"}
                      startCheckoutAction={startCheckoutAction}
                    />
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--of-border)",
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {planFeatureOrder.map((feature) => {
                    const included = planIncludes(item.id, feature);
                    return (
                      <div
                        key={`${item.id}-${feature}`}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            minWidth: 18,
                            width: 18,
                            height: 18,
                            borderRadius: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: included ? "rgba(112, 187, 129, 0.12)" : "rgba(136, 150, 179, 0.12)",
                            color: included ? "#70bb81" : "rgba(136, 150, 179, 0.5)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        >
                          {included ? "✓" : "✕"}
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            lineHeight: "1.4",
                            color: included ? "var(--of-text-primary)" : "rgba(136, 150, 179, 0.7)",
                            fontWeight: included ? 500 : 400,
                          }}
                        >
                          {featureCatalog[feature].label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {canManageBilling ? (
          <article className="of-card">
            <div className="of-card-title">Gerenciar cobrança</div>
            <p className="of-list-description mb-4">
              {billingProvider === "Stripe"
                ? "Atualize cartão, gerencie PIX, cancele ou altere o plano no portal seguro do Stripe."
                : `Sua assinatura atual usa ${billingProvider}. Confirme o PIX recorrente e acompanhe a ativação automática pelos webhooks.`}
            </p>
            {billingProvider === "Stripe" ? (
              <form action={openBillingPortalAction}>
                <button type="submit" className="of-btn-ghost" style={{ width: "100%", maxWidth: 320 }}>
                  Abrir portal do cliente Stripe
                </button>
              </form>
            ) : (
              <p className="of-list-description">
                Para trocar de plano ou gerar um novo PIX, inicie um novo checkout na grade de planos acima.
              </p>
            )}
          </article>
        ) : (
          <article className="of-card">
            <div className="of-card-title">Acesso à cobrança</div>
            <p className="of-list-description">
              Somente perfis com papel de administrador ou gestor podem iniciar checkout ou abrir portal de cobrança.
            </p>
          </article>
        )}
        <article className="of-card">
          <div className="of-card-title">Resumo rápido</div>
          <p className="of-list-description">
            Plano: <strong>{planLabel(currentPlan)}</strong>
          </p>
          <p className="of-list-description">
            Status: <strong>{statusLabel(assinatura?.status)}</strong>
          </p>
          <p className="of-list-description">
            Renovação:{" "}
            <strong>
              {assinatura?.periodo_fim ? new Date(assinatura.periodo_fim).toLocaleDateString("pt-BR") : "—"}
            </strong>
          </p>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--of-border)" }}>
            <p className="of-list-description" style={{ fontSize: "0.78rem", color: "var(--of-text-secondary)", marginBottom: 8 }}>
              Formas de pagamento aceitas:
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "var(--of-bg-secondary)", border: "1px solid var(--of-border)", fontSize: "0.78rem", fontWeight: 600 }}>
                Cartão de crédito
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "var(--of-bg-secondary)", border: "1px solid var(--of-border)", fontSize: "0.78rem", fontWeight: 600, opacity: 0.55 }} title="PIX em breve — disponível após ativação pelo Stripe">
                PIX (em breve)
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
