import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";
import { FeatureGate } from "@/components/feature-gate";
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
  const subscription = await getSubscriptionForCurrentTenant();

  return (
    <FeatureGate
      children={children}
      feature={feature}
      subscription={subscription}
      fallbackUI={fallbackUI}
    />
  );
}
