"use client";

import { useState } from "react";
import { BadgeCheck, CreditCard, QrCode, ShieldCheck, type LucideIcon } from "lucide-react";
import styles from "./gateway-selector.module.css";

type Gateway = "stripe" | "mercadopago" | "asaas";

const GATEWAYS: Array<{ id: Gateway; label: string; desc: string; badge?: string; Icon: LucideIcon }> = [
  { id: "stripe", label: "Cartão", desc: "Crédito via Stripe", badge: "Instantâneo", Icon: CreditCard },
  { id: "mercadopago", label: "PIX MP", desc: "Mercado Pago", badge: "Rápido", Icon: QrCode },
  { id: "asaas", label: "PIX Asaas", desc: "Confirmação segura", badge: "Seguro", Icon: ShieldCheck },
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

      <div className={styles.label}>Pagamento</div>

      <div className={styles.gatewayGrid}>
        {GATEWAYS.map((gw) => {
          const selected = gateway === gw.id;
          const Icon = gw.Icon;
          return (
            <button
              key={gw.id}
              type="button"
              onClick={() => setGateway(gw.id)}
              className={`${styles.gatewayCard} ${selected ? styles.selected : ""}`}
              aria-label={`Selecionar ${gw.label}`}
              aria-pressed={selected}
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
            </button>
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
