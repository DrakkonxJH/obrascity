"use client";

import { useState, useEffect } from "react";
import { PlanFeature, SubscriptionSnapshot } from "@/lib/billing/plans";
import { checkFeatureAccess, FeatureAccessStatus } from "@/lib/billing/feature-gate";

export function useFeatureAccess(subscription: SubscriptionSnapshot | null, feature: PlanFeature) {
  const [status, setStatus] = useState<FeatureAccessStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const accessStatus = checkFeatureAccess(subscription, feature);
    setStatus(accessStatus);

    // Auto-show modal se não tiver acesso
    if (accessStatus.level === "upgrade_required") {
      setShowUpgradeModal(true);
    }
  }, [subscription, feature]);

  return {
    status,
    hasAccess: status?.level === "allowed",
    isLoading: status === null,
    showUpgradeModal,
    setShowUpgradeModal,
  };
}
