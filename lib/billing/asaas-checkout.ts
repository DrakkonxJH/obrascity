/**
 * Asaas integration for recurring PIX subscriptions.
 * Docs: https://docs.asaas.com/reference/create-subscription
 */

import { getAppOrigin } from "@/lib/validations/env";
import type { PlanId } from "@/lib/billing/plans";
import type { BillingCycle } from "@/lib/billing/stripe-price-map";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_PRICES: Record<Exclude<PlanId, "trial">, Record<BillingCycle, number>> = {
  starter: { monthly: 129, annual: 1080 },
  pro: { monthly: 229, annual: 1908 },
  enterprise: { monthly: 799, annual: 6588 },
};

function getAsaasApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error("ASAAS_API_KEY não configurado. Obtenha em app.asaas.com e adicione ao Vercel.");
  }
  return key;
}

function getAsaasBaseUrl(): string {
  const isSandbox = (process.env.ASAAS_API_KEY ?? "").startsWith("$aact_");
  return isSandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
}

async function asaasFetch(path: string, options: RequestInit) {
  const apiKey = getAsaasApiKey();
  const base = getAsaasBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Asaas erro ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json();
}

async function findOrCreateAsaasCustomer(email: string, name: string): Promise<string> {
  const existing = (await asaasFetch(`/customers?email=${encodeURIComponent(email)}&limit=1`, {
    method: "GET",
  })) as { data?: Array<{ id?: string }> };

  const existingId = existing.data?.[0]?.id;
  if (existingId) {
    return existingId;
  }

  const customer = (await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: name || email.split("@")[0],
      email,
      notificationDisabled: false,
    }),
  })) as { id?: string };

  if (!customer.id) {
    throw new Error("Asaas não retornou o ID do cliente.");
  }

  return customer.id;
}

export async function createAsaasSubscription(input: {
  empresaId: string;
  customerEmail: string;
  customerName: string;
  plan: Exclude<PlanId, "trial">;
  billingCycle: BillingCycle;
}): Promise<{ subscriptionId: string; paymentUrl: string; pixQrCode?: string; pixCopyPaste?: string }> {
  const origin = getAppOrigin();
  const price = PLAN_PRICES[input.plan][input.billingCycle];
  const cycle = input.billingCycle === "monthly" ? "MONTHLY" : "YEARLY";
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const dueDateStr = nextDueDate.toISOString().split("T")[0] ?? nextDueDate.toISOString();

  const customerId = await findOrCreateAsaasCustomer(input.customerEmail, input.customerName);

  const subscription = (await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      cycle,
      value: price,
      nextDueDate: dueDateStr,
      description: `ObrasCitY ${input.plan} - ${input.billingCycle === "monthly" ? "Mensal" : "Anual"}`,
      externalReference: input.empresaId,
      callback: {
        successUrl: `${origin}/planos?checkout=success&gateway=asaas`,
        autoRedirect: true,
      },
    }),
  })) as { id?: string };

  if (!subscription.id) {
    throw new Error("Asaas não retornou o ID da assinatura.");
  }

  const subscriptionId = subscription.id;
  const payments = (await asaasFetch(`/subscriptions/${subscriptionId}/payments?limit=1`, {
    method: "GET",
  })) as { data?: Array<{ id?: string }> };
  const firstPayment = payments.data?.[0];

  let paymentUrl = `${origin}/planos/pix-asaas?sub=${subscriptionId}`;
  let pixQrCode: string | undefined;
  let pixCopyPaste: string | undefined;

  if (firstPayment?.id) {
    try {
      const pixInfo = (await asaasFetch(`/payments/${firstPayment.id}/pixQrCode`, {
        method: "GET",
      })) as { encodedImage?: string; payload?: string; checkoutUrl?: string };
      pixQrCode = pixInfo.encodedImage;
      pixCopyPaste = pixInfo.payload;
      paymentUrl = pixInfo.checkoutUrl ?? paymentUrl;
    } catch {
      // PIX QR code fetch is best-effort.
    }
  }

  try {
    const admin = createAdminClient();
    await admin.from("assinaturas").insert({
      empresa_id: input.empresaId,
      provider: "asaas",
      plano: input.plan,
      status: "pending_payment",
      external_customer_id: `asaas_${customerId}`,
      external_subscription_id: `asaas_${subscriptionId}`,
      periodo_inicio: new Date().toISOString(),
      periodo_fim: null,
    });
  } catch {
    // DB pre-create is best-effort; webhook will confirm.
  }

  return { subscriptionId, paymentUrl, pixQrCode, pixCopyPaste };
}
