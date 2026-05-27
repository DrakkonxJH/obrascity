import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/validations/env";
import { mapStripePriceIdToPlan } from "@/lib/billing/stripe-price-map";
import type { PlanId } from "@/lib/billing/plans";

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return "inativa";
    default:
      return "inativa";
  }
}

function getEmpresaIdFromMetadata(metadata: Stripe.Metadata | null | undefined) {
  const raw = metadata?.empresa_id;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

function getStripePriceIdFromSubscriptionItem(item: Stripe.SubscriptionItem | undefined) {
  const price = item?.price;
  if (!price) return undefined;
  return typeof price === "string" ? price : price.id;
}

function subscriptionItemPeriodEnd(subscription: Stripe.Subscription): number | null {
  const end = subscription.items?.data?.[0]?.current_period_end;
  return typeof end === "number" ? end : null;
}

export function constructStripeEvent(payload: string, signature: string) {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe não configurado no servidor");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function handleStripeEvent(event: Stripe.Event) {
  const admin = createAdminClient();
  const env = getEnv();

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY ausente");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    let empresaId = getEmpresaIdFromMetadata(session.metadata);
    if (!empresaId && session.client_reference_id) {
      empresaId = session.client_reference_id;
    }
    if (!empresaId) return;

    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subscriptionId) {
      await admin.rpc("log_stripe_event", {
        p_empresa_id: empresaId,
        p_event_type: event.type,
        p_external_event_id: event.id,
        p_payload: { ...session, note: "no_subscription_on_session" } as unknown as Record<
          string,
          unknown
        >,
      });
      return;
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = getStripePriceIdFromSubscriptionItem(sub.items.data[0]);
    const plano = mapStripePriceIdToPlan(priceId) as PlanId | null;
    if (!plano) {
      await admin.rpc("log_stripe_event", {
        p_empresa_id: empresaId,
        p_event_type: event.type,
        p_external_event_id: event.id,
        p_payload: { priceId, note: "unknown_price_id" } as unknown as Record<string, unknown>,
      });
      return;
    }

    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    const periodEndUnix = subscriptionItemPeriodEnd(sub);
    const periodoFim = periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null;

    await admin.rpc("sync_subscription_from_stripe", {
      p_empresa_id: empresaId,
      p_plano: plano,
      p_status: mapStripeStatus(sub.status),
      p_external_customer_id: customerId ?? null,
      p_external_subscription_id: subscriptionId,
      p_periodo_fim: periodoFim,
    });

    await admin.rpc("log_stripe_event", {
      p_empresa_id: empresaId,
      p_event_type: event.type,
      p_external_event_id: event.id,
      p_payload: event as unknown as Record<string, unknown>,
    });
    return;
  }

  // PIX payments: invoice.paid fires when a PIX QR Code is paid.
  // This activates subscriptions that were in `incomplete` status waiting for PIX.
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const rawSubRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      typeof rawSubRef === "string" ? rawSubRef : (rawSubRef as Stripe.Subscription | null | undefined)?.id;
    if (!subscriptionId) return;

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const empresaId = getEmpresaIdFromMetadata(sub.metadata);
    if (!empresaId) return;

    const priceId = getStripePriceIdFromSubscriptionItem(sub.items.data[0]);
    const plano = mapStripePriceIdToPlan(priceId) as PlanId | null;
    if (!plano) return;

    const status = event.type === "invoice.paid" ? mapStripeStatus(sub.status) : "past_due";
    const periodEndUnix = subscriptionItemPeriodEnd(sub);
    const periodoFim = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

    await admin.rpc("sync_subscription_from_stripe", {
      p_empresa_id: empresaId,
      p_plano: plano,
      p_status: status,
      p_external_customer_id: customerId ?? null,
      p_external_subscription_id: subscriptionId,
      p_periodo_fim: periodoFim,
    });

    await admin.rpc("log_stripe_event", {
      p_empresa_id: empresaId,
      p_event_type: event.type,
      p_external_event_id: event.id,
      p_payload: event as unknown as Record<string, unknown>,
    });
    return;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const empresaId = getEmpresaIdFromMetadata(subscription.metadata);
    if (!empresaId) return;

    const priceId = getStripePriceIdFromSubscriptionItem(subscription.items.data[0]);
    const plano = mapStripePriceIdToPlan(priceId) as PlanId | null;
    if (!plano) {
      await admin.rpc("log_stripe_event", {
        p_empresa_id: empresaId,
        p_event_type: event.type,
        p_external_event_id: event.id,
        p_payload: { priceId, note: "unknown_price_id" } as unknown as Record<string, unknown>,
      });
      return;
    }

    const status =
      event.type === "customer.subscription.deleted"
        ? "canceled"
        : mapStripeStatus(subscription.status);

    const periodEndUnix = subscriptionItemPeriodEnd(subscription);
    const periodoFim = periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null;

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

    await admin.rpc("sync_subscription_from_stripe", {
      p_empresa_id: empresaId,
      p_plano: plano,
      p_status: status,
      p_external_customer_id: customerId ?? null,
      p_external_subscription_id: subscription.id,
      p_periodo_fim: periodoFim,
    });

    await admin.rpc("log_stripe_event", {
      p_empresa_id: empresaId,
      p_event_type: event.type,
      p_external_event_id: event.id,
      p_payload: event as unknown as Record<string, unknown>,
    });
  }
}
