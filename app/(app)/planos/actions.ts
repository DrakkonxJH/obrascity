"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { createMercadoPagoSubscription } from "@/lib/billing/mercadopago-checkout";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

const BILLING_ROLES = new Set(["administrador", "gestor"]);

type CheckoutPlan = "starter" | "pro" | "enterprise";
type BillingCycle = "monthly" | "annual";

async function requireBillingProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Sessao invalida.");
  }
  if (!BILLING_ROLES.has(profile.role as string)) {
    throw new Error("Apenas administrador ou gestor pode alterar o plano de uso.");
  }
  return profile;
}

function errorRedirect(message: string): never {
  redirect(`/planos?erro=${encodeURIComponent(message)}`);
}

export async function startCheckoutAction(formData: FormData) {
  let checkoutUrl: string;
  try {
    const profile = await requireBillingProfile();
    const raw = String(formData.get("plan") ?? "").trim().toLowerCase();
    if (raw !== "starter" && raw !== "pro" && raw !== "enterprise") {
      throw new Error("Plano invalido.");
    }
    const plan = raw as CheckoutPlan;
    const rawCycle = String(formData.get("billingCycle") ?? "annual").trim().toLowerCase();
    if (rawCycle !== "monthly" && rawCycle !== "annual") {
      throw new Error("Ciclo de cobranca invalido.");
    }
    const billingCycle = rawCycle as BillingCycle;
    const gateway = String(formData.get("gateway") ?? "mercadopago").trim().toLowerCase();

    const empresaId = await getEmpresaIdFromProfile();

    if (gateway !== "mercadopago") {
      throw new Error("Stripe e Asaas estão temporariamente desativados. Use Mercado Pago.");
    }

    checkoutUrl = await createMercadoPagoSubscription({
      empresaId,
      customerEmail: String(profile.email),
      plan,
      billingCycle,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel abrir o checkout.";
    errorRedirect(message);
  }

  redirect(checkoutUrl);
}

export async function openBillingPortalAction() {
  try {
    await requireBillingProfile();
    throw new Error("Portal Stripe desativado temporariamente. Use Mercado Pago.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel abrir o portal.";
    errorRedirect(message);
  }
}
