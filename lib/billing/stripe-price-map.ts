import type { PlanId } from "@/lib/billing/plans";

export type BillingCycle = "monthly" | "annual";

function parsePriceIdList(envValue: string | undefined) {
  return (envValue ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Primeiro Price ID da lista de env para o plano de checkout. */
export function getDefaultStripePriceIdForPlan(plan: Exclude<PlanId, "trial">): string | null {
  return getStripePriceIdForPlan(plan, "monthly");
}

/** Mapeia Price ID por ciclo. Ordem esperada no env: mensal, anual. */
export function getStripePriceIdForPlan(
  plan: Exclude<PlanId, "trial">,
  billingCycle: BillingCycle,
): string | null {
  const key =
    plan === "starter"
      ? process.env.STRIPE_PRICE_STARTER_IDS
      : plan === "pro"
        ? process.env.STRIPE_PRICE_PRO_IDS
        : process.env.STRIPE_PRICE_ENTERPRISE_IDS;

  const ids = parsePriceIdList(key);
  if (ids.length === 0) return null;
  if (billingCycle === "annual") return ids[1] ?? ids[0] ?? null;
  return ids[0] ?? ids[1] ?? null;
}

/** Mapeia o Price ID da assinatura Stripe para o plano interno. */
export function mapStripePriceIdToPlan(priceId: string | undefined): PlanId | null {
  if (!priceId) return null;

  if (parsePriceIdList(process.env.STRIPE_PRICE_ENTERPRISE_IDS).includes(priceId)) {
    return "enterprise";
  }
  if (parsePriceIdList(process.env.STRIPE_PRICE_PRO_IDS).includes(priceId)) {
    return "pro";
  }
  if (parsePriceIdList(process.env.STRIPE_PRICE_STARTER_IDS).includes(priceId)) {
    return "starter";
  }

  return null;
}
