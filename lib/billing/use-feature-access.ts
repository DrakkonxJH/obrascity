"use client";

import { useMemo, useState } from "react";
import { PlanFeature, SubscriptionSnapshot } from "@/lib/billing/plans";
import { checkFeatureAccess } from "@/lib/billing/feature-gate";

export function useFeatureAccess(subscription: SubscriptionSnapshot | null, feature: PlanFeature) {
  const status = useMemo(
    () => checkFeatureAccess(subscription, feature),
    [subscription, feature],
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return {
    status,
    hasAccess: status?.level === "allowed",
    isLoading: false,
    showUpgradeModal: showUpgradeModal || status.level === "upgrade_required",
    setShowUpgradeModal,
  };
}
