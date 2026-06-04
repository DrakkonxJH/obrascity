"use client";

import { useState } from "react";
import { BadgeCheck, QrCode, type LucideIcon } from "lucide-react";
import styles from "./gateway-selector.module.css";

type Gateway = "mercadopago";

const GATEWAYS: Array<{ id: Gateway; label: string; desc: string; badge?: string; Icon: LucideIcon }> = [
  { id: "mercadopago", label: "PIX Mercado Pago", desc: "Pagamento via Mercado Pago", badge: "Ativo", Icon: QrCode },
];

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
  isUpgrade: boolean;
  startCheckoutAction: (fd: FormData) => Promise<void>;
}) {
  const gateway: Gateway = "mercadopago";
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

      <div className={styles.label}>Pagamento</div>

      <div className={styles.gatewayGrid}>
        {GATEWAYS.map((gw) => {
          const selected = gateway === gw.id;
          const Icon = gw.Icon;
          return (
            <div
              key={gw.id}
              role="group"
              className={`${styles.gatewayCard} ${selected ? styles.selected : ""}`}
              aria-label={gw.label}
            >
              <div className={styles.cardContent}>
                <div className={styles.iconWrapper}>
                  <Icon size={16} aria-hidden />
                </div>
                <div className={styles.textContent}>
                  <span className={styles.gatewayLabel}>{gw.label}</span>
                  <span className={styles.gatewayDesc}>{gw.desc}</span>
                </div>
              </div>
              {gw.badge ? <span className={styles.badge}>{gw.badge}</span> : null}
              {selected ? <BadgeCheck className={styles.selectedIcon} size={16} aria-hidden /> : null}
            </div>
          );
        })}
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
