"use client";

import { useState } from "react";

type Gateway = "stripe" | "mercadopago" | "asaas";

const GATEWAYS: Array<{ id: Gateway; label: string; icon: string; desc: string }> = [
  { id: "stripe", label: "Cartão de crédito", icon: "💳", desc: "Visa, Master, Elo" },
  { id: "mercadopago", label: "PIX — Mercado Pago", icon: "⚡", desc: "PIX instantâneo" },
  { id: "asaas", label: "PIX — Asaas", icon: "⚡", desc: "PIX recorrente" },
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

  return (
    <form action={startCheckoutAction} style={{ width: "100%" }}>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="billingCycle" value={billingCycle} />
      <input type="hidden" name="gateway" value={gateway} />

      <div style={{ marginBottom: 10 }}>
        {GATEWAYS.map((gw) => (
          <label
            key={gw.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              marginBottom: 4,
              borderRadius: 6,
              border: `1px solid ${gateway === gw.id ? "var(--of-blue, #2563eb)" : "var(--of-border)"}`,
              background: gateway === gw.id ? "rgba(37,99,235,0.06)" : "transparent",
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "all 0.15s",
            }}
          >
            <input
              type="radio"
              name={`_gateway_display_${plan}`}
              value={gw.id}
              checked={gateway === gw.id}
              onChange={() => setGateway(gw.id)}
              style={{ accentColor: "var(--of-blue, #2563eb)" }}
            />
            <span>{gw.icon}</span>
            <span style={{ fontWeight: 500 }}>{gw.label}</span>
            <span style={{ color: "var(--of-text-secondary)", marginLeft: "auto", fontSize: "0.78rem" }}>
              {gw.desc}
            </span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "11px 16px",
          background: plan === "pro" ? "#ff6b1a" : "var(--of-blue)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: "0.95rem",
          cursor: "pointer",
        }}
      >
        {isUpgrade ? "Fazer upgrade" : `Assinar ${planName}`}
      </button>
    </form>
  );
}
