import { getCurrentProfile } from "@/lib/auth/require-profile";
import type { PlanFeature, PlanId } from "@/lib/billing/plans";
import { planIncludes } from "@/lib/billing/plans";
import Link from "next/link";
import type { BillingCycle } from "@/lib/billing/stripe-price-map";

import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { openBillingPortalAction, startCheckoutAction } from "./actions";

const BILLING_ROLES = new Set(["administrador", "gestor"]);

const featureCatalog: Record<PlanFeature, { label: string }> = {
  dashboard: { label: "Dashboard operacional" },
  obras_basic: { label: "Gestão de obras" },
  equipes_basic: { label: "Gestão de equipes" },
  materiais_basic: { label: "Gestão de materiais" },
  cronograma: { label: "Cronograma de obra" },
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
  if (value === "canceled") return "Cancelada";
  if (value === "incomplete") return "Incompleta";
  return "Nao configurada";
}

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; erro?: string; billing?: string }>;
}) {
  const params = await searchParams;
  const [assinatura, profile] = await Promise.all([getAssinaturaAtual(), getCurrentProfile()]);
  const canManageBilling = profile ? BILLING_ROLES.has(profile.role as string) : false;

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
    highlight?: boolean;
  }> = [
    {
      id: "starter",
      name: "Starter",
      monthly: 99,
      annual: 69,
      blurb: "Base essencial para controlar obras com rapidez.",
      audience: "Ideal para equipes iniciando digitalizacao.",
    },
    {
      id: "pro",
      name: "Pro",
      monthly: 229,
      annual: 159,
      blurb: "Mais controle financeiro e produtividade de gestão.",
      audience: "Ideal para operacao em crescimento.",
      highlight: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthly: 799,
      annual: 549,
      blurb: "Escalabilidade e integração para operacoes complexas.",
      audience: "Ideal para multiplas obras e integrações.",
    },
  ];

  const checkoutMessage =
    params.checkout === "success"
      ? { kind: "success" as const, text: "Pagamento processado. Seu plano sera atualizado em instantes." }
      : params.checkout === "cancel"
        ? { kind: "info" as const, text: "Checkout cancelado. Nenhuma cobranca foi feita." }
        : null;

  const errorMessage = params.erro?.trim() ? decodeURIComponent(params.erro) : null;

  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 18, alignItems: "flex-start" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            Plano de uso
          </h1>
          <p className="of-empty-text">
            Organize a assinatura da sua empresa e evolua o plano conforme a operação cresce.
          </p>
        </div>
      </div>

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
              ? "Voce pode abrir checkout e portal Stripe."
              : "Somente administrador/gestor altera plano."}
          </p>
        </article>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8, color: "var(--of-blue)" }}>
            Escolha seu plano
          </h2>
        </div>

        <div
          style={{
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0,
              border: "1px solid var(--of-border)",
              borderRadius: 999,
              padding: 4,
              background: "var(--of-bg-3)",
            }}
          >
            <Link
              href={`/planos?billing=monthly`}
              style={{
                padding: "8px 16px",
                textDecoration: "none",
                color: billingCycle === "monthly" ? "#fff" : "var(--of-text-secondary)",
                fontWeight: billingCycle === "monthly" ? 600 : 500,
                fontSize: "0.9rem",
                borderRadius: billingCycle === "monthly" ? 999 : 0,
                background: billingCycle === "monthly" ? "#ff6b1a" : "transparent",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              Mensal
            </Link>
            <Link
              href={`/planos?billing=annual`}
              style={{
                padding: "8px 16px",
                textDecoration: "none",
                color: billingCycle === "annual" ? "#fff" : "var(--of-text-secondary)",
                fontWeight: billingCycle === "annual" ? 600 : 500,
                fontSize: "0.9rem",
                borderRadius: billingCycle === "annual" ? 999 : 0,
                background: billingCycle === "annual" ? "#ff6b1a" : "transparent",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              Anual
            </Link>
          </div>
          {billingCycle === "annual" && (
            <span
              style={{
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
        </div>
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
                    <form action={startCheckoutAction} style={{ width: "100%" }}>
                      <input type="hidden" name="plan" value={item.id} />
                      <input type="hidden" name="billingCycle" value={billingCycle} />
                      <button
                        type="submit"
                        style={{
                          width: "100%",
                          padding: "11px 16px",
                          background: item.highlight ? "#ff6b1a" : "var(--of-blue)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        
                      >
                        {currentPlan === "trial" ? `Assinar ${item.name}` : `Fazer upgrade`}
                      </button>
                    </form>
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
              Atualize cartão, cancele ou altere o plano no portal seguro do Stripe.
            </p>
            <form action={openBillingPortalAction}>
              <button type="submit" className="of-btn-ghost" style={{ width: "100%", maxWidth: 320 }}>
                Abrir portal do cliente Stripe
              </button>
            </form>
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
        </article>
      </div>
    </section>
  );
}
