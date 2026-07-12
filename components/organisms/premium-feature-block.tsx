import Link from "next/link";
import type { FeatureAccessStatus } from "@/lib/billing/feature-gate";

type PremiumFeatureBlockProps = {
  featureName: string;
  status: FeatureAccessStatus;
};

export function PremiumFeatureBlock({ featureName, status }: PremiumFeatureBlockProps) {
  return (
    <section className="of-page">
      <article
        className="of-card"
        style={{
          padding: 32,
          textAlign: "center",
          background: "rgba(255, 107, 26, 0.05)",
          borderRadius: 12,
          border: "1px dashed rgba(255, 107, 26, 0.3)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--of-blue)",
            marginBottom: 8,
          }}
        >
          {featureName} indisponível neste plano
        </h2>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--of-text-secondary)",
            marginBottom: 16,
            lineHeight: "1.5",
          }}
        >
          {status.message}
        </p>
        <Link
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
          }}
        >
          Fazer upgrade
        </Link>
      </article>
    </section>
  );
}
