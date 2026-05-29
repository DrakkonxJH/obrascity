"use client";

import { useState } from "react";
import styles from "./gateway-selector.module.css";

type Gateway = "stripe" | "mercadopago" | "asaas";

const GATEWAYS: Array<{ id: Gateway; label: string; desc: string; badge?: string }> = [
  { id: "stripe", label: "Cartão de Crédito", desc: "Visa, Mastercard, Elo", badge: "Instantâneo" },
  { id: "mercadopago", label: "PIX Mercado Pago", desc: "Pagamento imediato", badge: "Rápido" },
  { id: "asaas", label: "PIX Asaas", desc: "PIX com confirmação", badge: "Seguro" },
];

const GatewayIcons = {
  stripe: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  ),
  mercadopago: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h4v-6h-4v6zm6-10h-4v4h4V7z" />
    </svg>
  ),
  asaas: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h4v-6h-4v6zm6-10h-4v4h4V7z" />
    </svg>
  ),
};

export function GatewayCheckoutForm({
  plan,
  billingCycle,
  planName,
  isUpgrade,
  startCheckoutAction,
}: {
  plan: string;
  billingCycle: string;
  planName: string;
  currentPlan: string;
  isUpgrade: boolean;
  startCheckoutAction: (fd: FormData) => Promise<void>;
}) {
  const [gateway, setGateway] = useState<Gateway>("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await startCheckoutAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="billingCycle" value={billingCycle} />
      <input type="hidden" name="gateway" value={gateway} />

      <div className={styles.label}>Escolha seu método de pagamento</div>

      <div className={styles.gatewayGrid}>
        {GATEWAYS.map((gw) => (
          <button
            key={gw.id}
            type="button"
            onClick={() => setGateway(gw.id)}
            className={`${styles.gatewayCard} ${gateway === gw.id ? styles.selected : ""}`}
            aria-label={`Selecionar ${gw.label}`}
          >
            <div className={styles.cardContent}>
              <div className={styles.iconWrapper}>
                {GatewayIcons[gw.id]}
              </div>
              <div className={styles.textContent}>
                <h3 className={styles.gatewayLabel}>{gw.label}</h3>
                <p className={styles.gatewayDesc}>{gw.desc}</p>
              </div>
              {gw.badge && <span className={styles.badge}>{gw.badge}</span>}
            </div>
            <div className={styles.radioContainer}>
              <div className={`${styles.radio} ${gateway === gw.id ? styles.radioSelected : ""}`} />
            </div>
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${styles.submitButton} ${plan === "pro" ? styles.submitPro : ""}`}
      >
        {isSubmitting ? (
          <>
            <span className={styles.spinner} />
            Processando...
          </>
        ) : (
          isUpgrade ? "Fazer upgrade" : `Assinar ${planName}`
        )}
      </button>
    </form>
  );
}
