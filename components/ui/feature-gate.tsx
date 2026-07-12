"use client";

import { ReactNode } from "react";
import { PlanFeature, SubscriptionSnapshot } from "@/lib/billing/plans";
import { useFeatureAccess } from "@/lib/billing/use-feature-access";
import { getFeatureName } from "@/lib/billing/feature-gate";
import { UpgradeModal } from "@/components/organisms/upgrade-modal";

interface FeatureGateProps {
  children: ReactNode;
  feature: PlanFeature;
  subscription: SubscriptionSnapshot | null;
  fallbackUI?: ReactNode;
}

export function FeatureGate({ children, feature, subscription, fallbackUI }: FeatureGateProps) {
  const { hasAccess, status, showUpgradeModal, setShowUpgradeModal } = useFeatureAccess(
    subscription,
    feature,
  );

  const featureName = getFeatureName(feature);

  if (!hasAccess && fallbackUI) {
    return (
      <>
        {fallbackUI}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureStatus={status!}
          featureName={featureName}
        />
      </>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            background: "rgba(255, 107, 26, 0.05)",
            borderRadius: 12,
            border: "1px dashed rgba(255, 107, 26, 0.3)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--of-blue)",
              marginBottom: 8,
            }}
          >
            Recurso Premium Bloqueado
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--of-text-secondary)",
              marginBottom: 16,
              lineHeight: "1.5",
            }}
          >
            {status?.message}
          </p>
          <a
            href="/planos"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              background: "#ff6b1a",
              color: "#fff",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            Fazer Upgrade
          </a>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureStatus={status!}
          featureName={featureName}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureStatus={status!}
        featureName={featureName}
      />
    </>
  );
}
