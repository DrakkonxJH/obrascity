import { getCurrentProfile } from "@/lib/auth/require-profile";
import type { PlanId } from "@/lib/billing/plans";
import Link from "next/link";
import type { BillingCycle } from "@/lib/billing/stripe-price-map";

import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { openBillingPortalAction, startCheckoutAction } from "./actions";
import { featuresAgrupadas, type CategoriaFeature } from "@/lib/billing/features-agrupadas";

const BILLING_ROLES = new Set(["administrador", "gestor"]);

const categoriasLabels: Record<CategoriaFeature, { emoji: string; label: string }> = {
  operacional: { emoji: "🎯", label: "Operacional" },
  relatórios: { emoji: "📊", label: "Relatórios" },
  comunicação: { emoji: "💬", label: "Comunicação" },
  integração: { emoji: "🔌", label: "Integrações" },
  automacao: { emoji: "⚙️", label: "Automações" },
  segurança: { emoji: "🔐", label: "Segurança" },
  api: { emoji: "🚀", label: "API" },
};

const PLANOS = [
  {
    id: "starter" as const,
    nome: "Starter",
    monthly: 99,
    annual: 69,
    descricao: "Base essencial",
    cor: "blue",
  },
  {
    id: "pro" as const,
    nome: "Pro",
    monthly: 229,
    annual: 159,
    descricao: "Profissional",
    cor: "orange",
    destaque: true,
  },
  {
    id: "enterprise" as const,
    nome: "Enterprise",
    monthly: 799,
    annual: 549,
    descricao: "Corporativo",
    cor: "red",
  },
];

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; erro?: string; billing?: string }>;
}) {
  const params = await searchParams;
  const [assinatura, profile] = await Promise.all([getAssinaturaAtual(), getCurrentProfile()]);
  const canManageBilling = profile ? BILLING_ROLES.has(profile.role as string) : false;

  const currentPlan = (assinatura?.plano ?? "trial") as PlanId;
  const billingCycle: BillingCycle = params.billing === "monthly" ? "monthly" : "annual";

  const checkoutMessage =
    params.checkout === "success"
      ? { kind: "success" as const, text: "Pagamento processado. Seu plano será atualizado em instantes." }
      : params.checkout === "cancel"
        ? { kind: "info" as const, text: "Checkout cancelado. Nenhuma cobrança foi feita." }
        : null;

  const errorMessage = params.erro?.trim() ? decodeURIComponent(params.erro) : null;

  return (
    <section className="of-page" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Header */}
      <div className="of-inline-header" style={{ marginBottom: 40, alignItems: "flex-start" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            Planos de Preços
          </h1>
          <p className="of-page-description">
            Escolha o plano ideal para sua operação. Todos incluem suporte técnico e atualizações.
          </p>
        </div>
      </div>

      {checkoutMessage && (
        <div
          className={`of-alert of-alert-${checkoutMessage.kind}`}
          style={{ marginBottom: 24 }}
        >
          {checkoutMessage.text}
        </div>
      )}
      {errorMessage && (
        <div className="of-alert of-alert-error" style={{ marginBottom: 24 }}>
          {errorMessage}
        </div>
      )}

      {/* Tabela de Comparação */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid var(--of-border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "var(--of-surface)",
          }}
        >
          {/* Header da Tabela */}
          <thead>
            <tr style={{ borderBottom: "2px solid var(--of-border)" }}>
              <th
                style={{
                  padding: "20px 24px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--of-text-secondary)",
                  backgroundColor: "rgba(136, 150, 179, 0.04)",
                  width: "40%",
                }}
              >
                Funcionalidades
              </th>

              {PLANOS.map((plano) => (
                <th
                  key={plano.id}
                  style={{
                    padding: "20px 24px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--of-text-primary)",
                    backgroundColor: plano.destaque ? "rgba(255, 107, 26, 0.05)" : "transparent",
                    borderLeft: "1px solid var(--of-border)",
                    position: "relative",
                  }}
                >
                  {plano.destaque && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#ff6b1a",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    >
                      MAIS POPULAR
                    </div>
                  )}
                  <div>{plano.nome}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--of-text-secondary)", marginTop: 4 }}>
                    {plano.descricao}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Preços */}
          <tbody>
            <tr style={{ borderBottom: "2px solid var(--of-border)" }}>
              <td
                style={{
                  padding: "20px 24px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--of-text-secondary)",
                }}
              >
                Preço/mês
              </td>

              {PLANOS.map((plano) => (
                <td
                  key={plano.id}
                  style={{
                    padding: "20px 24px",
                    textAlign: "center",
                    borderLeft: "1px solid var(--of-border)",
                    backgroundColor: plano.destaque ? "rgba(255, 107, 26, 0.05)" : "transparent",
                  }}
                >
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--of-text-primary)" }}>
                    R${billingCycle === "monthly" ? plano.monthly : plano.annual}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--of-text-secondary)", marginTop: 4 }}>
                    {billingCycle === "monthly" ? "por mês" : "por mês (anual)"}
                  </div>
                </td>
              ))}
            </tr>

            {/* Botão de Ação */}
            <tr style={{ borderBottom: "2px solid var(--of-border)" }}>
              <td style={{ padding: "20px 24px" }} />
              {PLANOS.map((plano) => (
                <td
                  key={plano.id}
                  style={{
                    padding: "20px 24px",
                    textAlign: "center",
                    borderLeft: "1px solid var(--of-border)",
                    backgroundColor: plano.destaque ? "rgba(255, 107, 26, 0.05)" : "transparent",
                  }}
                >
                  {currentPlan === plano.id ? (
                    <div
                      style={{
                        padding: "10px 16px",
                        backgroundColor: "rgba(112, 187, 129, 0.12)",
                        color: "#70bb81",
                        borderRadius: 6,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      Plano Atual
                    </div>
                  ) : !canManageBilling ? (
                    <div
                      style={{
                        padding: "10px 16px",
                        backgroundColor: "rgba(136, 150, 179, 0.12)",
                        color: "var(--of-text-secondary)",
                        borderRadius: 6,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      Sem permissão
                    </div>
                  ) : (
                    <form action={startCheckoutAction} style={{ display: "inline-block" }}>
                      <input type="hidden" name="plan" value={plano.id} />
                      <input type="hidden" name="billingCycle" value={billingCycle} />
                      <button
                        type="submit"
                        style={{
                          padding: "10px 24px",
                          background: plano.destaque ? "#ff6b1a" : "var(--of-blue)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          minWidth: 160,
                        }}
                      >
                        {currentPlan === "trial" ? "Assinar" : "Upgrade"}
                      </button>
                    </form>
                  )}
                </td>
              ))}
            </tr>

            {/* Features por Categoria */}
            {Object.entries(categoriasLabels).map(([categoria, { emoji, label }]) => {
              const features = featuresAgrupadas[categoria as CategoriaFeature];
              if (!features?.length) return null;

              return (
                <tbody key={categoria}>
                  {/* Cabeçalho da Categoria */}
                  <tr
                    style={{
                      backgroundColor: "rgba(136, 150, 179, 0.08)",
                      borderBottom: "1px solid var(--of-border)",
                    }}
                  >
                    <td
                      colSpan={4}
                      style={{
                        padding: "12px 24px",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "var(--of-text-primary)",
                      }}
                    >
                      {emoji} {label}
                    </td>
                  </tr>

                  {/* Features da Categoria */}
                  {features.map((feature) => (
                    <tr
                      key={feature.id}
                      style={{
                        borderBottom: "1px solid var(--of-border)",
                        
                      }}
                    >
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontWeight: 500, color: "var(--of-text-primary)" }}>
                          {feature.nome}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--of-text-secondary)",
                            marginTop: 4,
                          }}
                        >
                          {feature.descricao}
                        </div>
                      </td>

                      {PLANOS.map((plano) => (
                        <td
                          key={`${feature.id}-${plano.id}`}
                          style={{
                            padding: "16px 24px",
                            textAlign: "center",
                            borderLeft: "1px solid var(--of-border)",
                            backgroundColor: plano.destaque ? "rgba(255, 107, 26, 0.05)" : "transparent",
                          }}
                        >
                          {feature.tiers.includes(plano.id as any) ? (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                backgroundColor: "rgba(112, 187, 129, 0.12)",
                                color: "#70bb81",
                                fontSize: "1rem",
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                backgroundColor: "rgba(136, 150, 179, 0.12)",
                                color: "rgba(136, 150, 179, 0.5)",
                                fontSize: "1.2rem",
                              }}
                            >
                              —
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CTA Footer */}
      <div
        style={{
          marginTop: 40,
          padding: 24,
          backgroundColor: "rgba(255, 107, 26, 0.05)",
          borderRadius: 12,
          border: "1px solid rgba(255, 107, 26, 0.2)",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--of-text-secondary)", marginBottom: 12 }}>
          Dúvidas sobre qual plano escolher?
        </p>
        <Link
          href="/contato"
          style={{
            color: "#ff6b1a",
            textDecoration: "none",
            fontWeight: 600,
            transition: "opacity 0.2s ease",
          }}
        >
          Entre em contato com nosso time →
        </Link>
      </div>
    </section>
  );
}
