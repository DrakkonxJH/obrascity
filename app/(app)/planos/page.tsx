import { getCurrentProfile } from "@/lib/auth/require-profile";
import type { PlanId } from "@/lib/billing/plans";
import { getProfileLimitByPlan } from "@/lib/billing/plans";
import Link from "next/link";
import type { BillingCycle } from "@/lib/billing/stripe-price-map";
import { CheckCircle2, CircleDollarSign, CreditCard, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { startCheckoutAction } from "./actions";
import { GatewayCheckoutForm } from "./gateway-selector";
import { PageHeader } from "@/components/ui/page-header";

const BILLING_ROLES = new Set(["administrador", "gestor"]);

const commercialSplit: Array<{
  id: Exclude<PlanId, "trial">;
  label: string;
  focus: string[];
  description: string;
  positioning: string;
}> = [
  {
    id: "starter",
    label: "Starter",
    focus: ["Obras", "Cronograma", "Equipes", "Materiais", "Viabilidade"],
    description: "Conta da empresa com rotina e poucos perfis.",
    positioning: "Organizacao inicial da operacao e controle basico do canteiro.",
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
    positioning: "Gestao integrada para empresas que ja vendem, executam e prestam contas.",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    focus: ["Mobile Campo", "API", "Automações", "Integrações", "Governança", "Segurança corporativa"],
    description: "Escala corporativa, governança e integrações avançadas.",
    positioning: "Controles de escala para operacoes maiores, integradas e auditaveis.",
  },
];

const sharedBaseCapabilities = [
  "Conta da empresa",
  "Perfis de usuarios internos",
  "Compartilhamento entre perfis",
  "Permissões por cargo",
  "Dashboard operacional",
  "Gestão de obras",
  "Gestão de equipes",
  "Materiais",
  "Cronograma",
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
  if ((subscriptionRef ?? "").startsWith("asaas_")) return "Asaas (desativado)";
  return "Stripe (desativado)";
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
    decision: string;
    modules: string[];
    upgrades: string[];
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
      decision: "Para construtoras que precisam sair da planilha e padronizar a rotina.",
      modules: ["Obras", "Cronograma", "Equipes", "Materiais", "Viabilidade"],
      upgrades: ["Controle operacional essencial", "Perfis internos por plano", "Base pronta para evoluir para Pro"],
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
      decision: "Para operacoes com mais times, financeiro ativo e prestacao de contas recorrente.",
      modules: ["CRM", "Projetos", "Financeiro", "Relatórios", "Mudanças", "Diário", "Qualidade", "Portal do Cliente"],
      upgrades: ["Relatórios e exportações", "Controle financeiro avancado", "Qualidade, entrega e garantia"],
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
      decision: "Para empresas que precisam integrar sistemas, auditar operacao e governar acessos.",
      modules: ["Mobile Campo", "API", "Automações", "Integrações", "Governança", "Segurança corporativa"],
      upgrades: ["API e integrações", "Automacoes de workflow", "SSO/SAML e suporte 24/7"],
      profileLimit: getProfileLimitByPlan("enterprise"),
    },
  ];

  const checkoutMessage =
    params.checkout === "success"
      ? {
          kind: "success" as const,
          text: "Assinatura iniciada no Mercado Pago. Confirme o PIX para ativar o plano; a atualização ocorre automaticamente após o webhook.",
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
            <p className="of-list-description" style={{ marginTop: 4 }}>
              Stripe e Asaas permanecem desativados até nova liberação.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/planos?billing=monthly" className={billingCycle === "monthly" ? "of-btn-primary" : "of-btn-ghost"}>
              Mensal
            </Link>
            <Link href="/planos?billing=annual" className={billingCycle === "annual" ? "of-btn-primary" : "of-btn-ghost"}>
              Anual
            </Link>
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

      <section className="of-plans-status-grid">
        <article className="of-plan-status-card">
          <CreditCard size={18} aria-hidden />
          <div>
            <span>Plano atual</span>
            <strong>{planLabel(currentPlan)}</strong>
          </div>
        </article>
        <article className="of-plan-status-card">
          <ShieldCheck size={18} aria-hidden />
          <div>
            <span>Status da assinatura</span>
            <strong>{statusLabel(assinatura?.status)}</strong>
            {assinatura?.periodo_fim ? (
              <small>{new Date(assinatura.periodo_fim).toLocaleDateString("pt-BR")}</small>
            ) : null}
          </div>
        </article>
        <article className="of-plan-status-card">
          <CircleDollarSign size={18} aria-hidden />
          <div>
            <span>Cobrança</span>
            <strong>{canManageBilling ? "Liberada" : "Restrita"}</strong>
            <small>{billingProvider}</small>
          </div>
        </article>
      </section>

      <section className="of-plans-common-band">
        <div>
          <p className="of-page-eyebrow">Base comum em todos os planos</p>
          <h2>O essencial não se repete na comparação.</h2>
          <p>
            Starter, Pro e Enterprise partem da mesma fundação operacional. A escolha do plano deve
            ser feita pelo nível de gestão, escala e automação que sua empresa precisa.
          </p>
        </div>
        <div className="of-plan-common-list">
          {sharedBaseCapabilities.map((item) => (
            <span key={item}>
              <CheckCircle2 size={14} aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="of-plan-split-panel">
        <div className="of-plan-section-head">
          <div>
            <p className="of-page-eyebrow">Separação comercial sugerida</p>
            <h2>Escolha pelo estágio da operação, não por uma lista repetida.</h2>
          </div>
          <span>{billingCycle === "annual" ? "Anual com melhor custo mensal" : "Mensal sem compromisso anual"}</span>
        </div>
        <div className="of-plan-split-grid">
          {commercialSplit.map((plan) => (
            <article key={plan.id} className={`of-plan-split-card ${plan.id === "pro" ? "featured" : ""}`}>
              <div className="of-plan-split-title">
                <strong>{plan.label}</strong>
                <span>{plan.description}</span>
              </div>
              <p>{plan.positioning}</p>
              <div className="of-plan-chip-row">
                {plan.focus.map((item) => (
                  <span key={`${plan.id}-${item}`}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="of-plan-pricing-section">
        <div className="of-plan-section-head">
          <div>
            <p className="of-page-eyebrow">Planos</p>
            <h2>Preços e módulos por estágio.</h2>
          </div>
          {billingCycle === "annual" ? <span>30% OFF no anual</span> : <span>Troque para anual e reduza o custo mensal</span>}
        </div>

        <div className="of-plan-offer">
          <Sparkles size={18} aria-hidden />
          <div>
            <strong>Oferta especial de entrada</strong>
            <span>20% OFF por 3 meses nos planos Pro e Enterprise para novos contratos.</span>
          </div>
        </div>

        <div className="of-plan-price-grid">
          {catalog.map((item) => {
            const itemOrder = planOrder[item.id] ?? 0;
            const isActiveSubscription = assinatura?.status === "active" || assinatura?.status === "trialing";
            const isCurrent = currentPlan === item.id && isActiveSubscription;
            const isUpgrade = itemOrder > currentOrder;
            const shownPrice = billingCycle === "monthly" ? item.monthly : item.annual;

            return (
              <article
                key={item.id}
                className={`of-plan-price-card ${item.highlight ? "featured" : ""}`}
              >
                {item.highlight && (
                  <div className="of-plan-popular">
                    MAIS POPULAR
                  </div>
                )}

                <div className="of-plan-card-top">
                  <span>{item.name}</span>
                  <strong>R$ {shownPrice}</strong>
                  <small>{billingCycle === "annual" ? "por mês · anual" : "por mês · mensal"}</small>
                  <p>{item.decision}</p>
                </div>

                <div className="of-plan-card-action">
                  {isCurrent ? (
                    <div className="of-plan-state ok">
                      Seu plano atual
                    </div>
                  ) : !isUpgrade ? (
                    <div className="of-plan-state">
                      Voce ja tem um plano superior
                    </div>
                  ) : !canManageBilling ? (
                    <div className="of-plan-state">
                      Sem permissao de cobrança
                    </div>
                  ) : (
                    <GatewayCheckoutForm
                      plan={item.id}
                      billingCycle={billingCycle}
                      planName={item.name}
                      isUpgrade={currentPlan !== "trial"}
                      startCheckoutAction={startCheckoutAction}
                    />
                  )}
                </div>

                <div className="of-plan-card-body">
                  <div>
                    <p>Módulos foco</p>
                    <div className="of-plan-chip-row compact">
                      {item.modules.map((module) => (
                        <span key={`${item.id}-${module}`}>{module}</span>
                      ))}
                    </div>
                  </div>
                  <div className="of-plan-upgrade-list">
                    {item.upgrades.map((upgrade) => (
                      <span key={`${item.id}-${upgrade}`}>
                        <CheckCircle2 size={14} aria-hidden />
                        {upgrade}
                      </span>
                    ))}
                  </div>
                  <div className="of-plan-profile-limit">
                    <UsersRound size={15} aria-hidden />
                    Até {item.profileLimit} perfis por empresa
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {canManageBilling ? (
        <article className="of-card">
          <div className="of-card-title">Gerenciar cobrança</div>
          <p className="of-list-description mb-4">
              {billingProvider === "Mercado Pago"
                ? "Confirme o PIX recorrente e acompanhe a ativação automática pelos webhooks do Mercado Pago."
                : `Sua assinatura atual usa ${billingProvider}. Novos checkouts permanecem no Mercado Pago enquanto Stripe e Asaas estão desativados.`}
          </p>
          <p className="of-list-description">
            Para trocar de plano ou gerar um novo PIX, inicie um novo checkout na grade de planos acima.
          </p>
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
                PIX Mercado Pago
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
