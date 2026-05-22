"use client";

import Link from "next/link";
import { FeatureAccessStatus } from "@/lib/billing/feature-gate";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureStatus: FeatureAccessStatus;
  featureName: string;
}

export function UpgradeModal({ isOpen, onClose, featureStatus, featureName }: UpgradeModalProps) {
  if (!isOpen) return null;

  const planLabels: Record<string, string> = {
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--of-bg-1)",
          borderRadius: 12,
          padding: 32,
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: "1px solid var(--of-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            🔒
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--of-blue)",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Recurso Premium
          </h2>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--of-text-secondary)",
              lineHeight: "1.5",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            <strong>{featureName}</strong> está disponível apenas no plano <strong>{planLabels[featureStatus.requiredPlan]}</strong> ou superior.
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              color: "rgba(136, 150, 179, 0.8)",
              textAlign: "center",
              lineHeight: "1.5",
            }}
          >
            Faça upgrade agora para desbloquear esta funcionalidade e muitos outros recursos avançados!
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 24,
          }}
        >
          <Link
            href="/planos"
            style={{
              display: "block",
              padding: "12px 16px",
              background: "#ff6b1a",
              color: "#fff",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: "0.95rem",
              textAlign: "center",
              textDecoration: "none",
              transition: "all 0.2s ease",
              border: "none",
              cursor: "pointer",
            }}
            onClick={(e) => {
              onClose();
            }}
          >
            Ver Planos e Preços
          </Link>
          <button
            onClick={onClose}
            style={{
              padding: "11px 16px",
              background: "var(--of-bg-3)",
              color: "var(--of-text-secondary)",
              borderRadius: 6,
              fontWeight: 500,
              fontSize: "0.95rem",
              border: "1px solid var(--of-border)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Entendido
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "var(--of-text-secondary)",
            padding: 0,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
