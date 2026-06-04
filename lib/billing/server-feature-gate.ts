import { checkFeatureAccess, type FeatureAccessStatus } from "@/lib/billing/feature-gate";
import type { PlanFeature } from "@/lib/billing/plans";
import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";

export async function getCurrentTenantFeatureAccess(
  feature: PlanFeature,
): Promise<{ subscription: Awaited<ReturnType<typeof getSubscriptionForCurrentTenant>>; access: FeatureAccessStatus }> {
  let subscription = null;
  try {
    subscription = await getSubscriptionForCurrentTenant();
  } catch {
    subscription = null;
  }
  return {
    subscription,
    access: checkFeatureAccess(subscription, feature),
  };
}
