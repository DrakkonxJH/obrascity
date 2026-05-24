import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";
import { FeatureGate } from "@/components/feature-gate";
import { planIncludes, PlanFeature } from "@/lib/billing/plans";
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
  const subscription = await getSubscriptionForCurrentTenant();
  const showTrialWarning =
    subscription?.plano === "trial" &&
    !planIncludes("starter", feature);

  return (
    <>
      {showTrialWarning ? (
        <article
          className="of-card"
          style={{
            marginBottom: 16,
            borderColor: "var(--of-yellow)",
            background: "rgba(255, 209, 102, 0.08)",
          }}
        >
          <p className="of-card-title">⚠ Acesso liberado no trial</p>
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
