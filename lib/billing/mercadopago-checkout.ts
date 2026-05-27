/**
 * Mercado Pago Checkout Pro integration for recurring subscriptions (PIX).
 * Uses MP Subscriptions API (preapproval) for recurring billing.
 * Docs: https://www.mercadopago.com.br/developers/pt/reference/subscriptions
 */

import { getAppOrigin } from "@/lib/validations/env";
import type { PlanId } from "@/lib/billing/plans";
import type { BillingCycle } from "@/lib/billing/stripe-price-map";

const PLAN_PRICES: Record<Exclude<PlanId, "trial">, Record<BillingCycle, number>> = {
  starter: { monthly: 9900, annual: 82800 },
  pro: { monthly: 22900, annual: 190800 },
  enterprise: { monthly: 79900, annual: 658800 },
};

function getMpAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado. Configure no painel do Mercado Pago e adicione ao Vercel.",
    );
  }
  return token;
}

export async function createMercadoPagoSubscription(input: {
  empresaId: string;
  customerEmail: string;
  plan: Exclude<PlanId, "trial">;
  billingCycle: BillingCycle;
}): Promise<string> {
  const token = getMpAccessToken();
  const origin = getAppOrigin();
  const priceInCents = PLAN_PRICES[input.plan][input.billingCycle];
  const priceInReais = priceInCents / 100;
  const planLabel = `ObrasCitY ${input.plan.charAt(0).toUpperCase() + input.plan.slice(1)} - ${input.billingCycle === "monthly" ? "Mensal" : "Anual"}`;
  const frequency = input.billingCycle === "monthly" ? 1 : 12;

  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `obrascity-${input.empresaId}-${input.plan}-${input.billingCycle}-${Date.now()}`,
    },
    body: JSON.stringify({
      reason: planLabel,
      auto_recurring: {
        frequency,
        frequency_type: "months",
        transaction_amount: priceInReais,
        currency_id: "BRL",
      },
      payer_email: input.customerEmail,
      back_url: `${origin}/planos?checkout=success&gateway=mp`,
      status: "pending",
      external_reference: input.empresaId,
      metadata: {
        empresa_id: input.empresaId,
        plan: input.plan,
        billing_cycle: input.billingCycle,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Mercado Pago erro ${response.status}: ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as { init_point?: string };
  if (!data.init_point) {
    throw new Error("Mercado Pago não retornou URL de pagamento.");
  }

  return data.init_point;
}
