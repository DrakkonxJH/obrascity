import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";
import { FeatureGate } from "@/components/ui/feature-gate";
import { PlanFeature } from "@/lib/billing/plans";
import { ReactNode } from "react";

interface FeatureGateWrapperProps {
  children: ReactNode;
  feature: PlanFeature;
  fallbackUI?: ReactNode;
}

export async function FeatureGateWrapper({
  children,
  feature,
  fallbackUI,
}: FeatureGateWrapperProps) {
  let subscription = null;
  let warning: string | null = null;

  try {
    subscription = await getSubscriptionForCurrentTenant();
  } catch (error) {
    warning =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar a assinatura do tenant.";
  }

  const showTrialWarning = subscription?.plano === "trial";

  return (
    <>
      {warning ? (
        <article
          className="of-card"
          style={{
            marginBottom: 16,
            borderColor: "var(--of-yellow)",
            background: "rgba(255, 209, 102, 0.08)",
          }}
        >
          <p className="of-card-title">Dados de acesso indisponíveis</p>
          <p className="of-empty-text">
            {warning} A página foi aberta com acesso limitado para evitar falha de carregamento.
          </p>
        </article>
      ) : null}
      {showTrialWarning ? (
        <article
          className="of-card"
          style={{
            marginBottom: 16,
            borderColor: "var(--of-yellow)",
            background: "rgba(255, 209, 102, 0.08)",
          }}
        >
          <p className="of-card-title">Ativo durante período de teste</p>
          <p className="of-empty-text">
            Este módulo está disponível durante os 14 dias de trial e pode deixar de ficar
            ativo após o período de avaliação, conforme o plano contratado.
          </p>
        </article>
      ) : null}
      <FeatureGate
        feature={feature}
        subscription={subscription}
        fallbackUI={fallbackUI}
      >
        {children}
      </FeatureGate>
    </>
  );
}
