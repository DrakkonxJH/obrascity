import Stripe from "stripe";
import { getAppOrigin, getEnv } from "@/lib/validations/env";
import { getStripePriceIdForPlan, type BillingCycle } from "@/lib/billing/stripe-price-map";
import type { PlanId } from "@/lib/billing/plans";

type CheckoutPlan = Exclude<PlanId, "trial">;

export async function createSubscriptionCheckoutSession(input: {
  empresaId: string;
  customerEmail: string;
  plan: CheckoutPlan;
  billingCycle: BillingCycle;
}) {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }

  const priceId = getStripePriceIdForPlan(input.plan, input.billingCycle);
  if (!priceId) {
    throw new Error(
      `Nenhum Price ID Stripe configurado para o plano "${input.plan}" (${input.billingCycle}). Defina STRIPE_PRICE_${input.plan.toUpperCase()}_IDS no .env (mensal,anual).`,
    );
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const origin = getAppOrigin();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card", "pix"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/planos?checkout=success`,
    cancel_url: `${origin}/planos?checkout=cancel`,
    customer_email: input.customerEmail,
    client_reference_id: input.empresaId,
    locale: "pt-BR",
    metadata: {
      empresa_id: input.empresaId,
    },
    subscription_data: {
      metadata: {
        empresa_id: input.empresaId,
      },
    },
    payment_method_options: {
      pix: {
        expires_after_seconds: 86400, // QR Code válido por 24h
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error("Stripe não retornou URL de checkout");
  }

  return session.url;
}

export async function createBillingPortalSession(customerId: string) {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const origin = getAppOrigin();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/planos`,
  });

  return session.url;
}
