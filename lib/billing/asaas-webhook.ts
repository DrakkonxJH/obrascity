import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

type AssinaturaLookup = {
  id: string;
  plano: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
};

function normalizePlan(value: string | null | undefined) {
  const normalized = String(value ?? "starter").trim().toLowerCase();
  return normalized === "starter" || normalized === "pro" || normalized === "enterprise"
    ? normalized
    : "starter";
}

function getAsaasBaseUrl() {
  const apiKey = process.env.ASAAS_API_KEY ?? "";
  return apiKey.startsWith("$aact_") ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
}

function dateOnlyToIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function findLatestAsaasRow(
  admin: ReturnType<typeof createAdminClient>,
  empresaId: string,
  externalSubscriptionId?: string,
): Promise<AssinaturaLookup | null> {
  let query = admin
    .from("assinaturas")
    .select("id, plano, external_customer_id, external_subscription_id")
    .eq("empresa_id", empresaId)
    .eq("provider", "asaas")
    .order("created_at", { ascending: false })
    .limit(1);

  if (externalSubscriptionId) {
    query = query.eq("external_subscription_id", externalSubscriptionId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    logger.warn({ event: "asaas_lookup_failed", empresaId, externalSubscriptionId, error: error.message }, "Falha ao localizar assinatura Asaas");
    return null;
  }

  return (data as AssinaturaLookup | null) ?? null;
}

async function fetchAsaasSubscription(subscriptionId: string) {
  const apiKey = process.env.ASAAS_API_KEY ?? "";
  if (!apiKey) return null;

  try {
    const res = await fetch(`${getAsaasBaseUrl()}/subscriptions/${subscriptionId}`, {
      headers: { access_token: apiKey },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { nextDueDate?: string; description?: string; customer?: string };
  } catch {
    return null;
  }
}

async function saveAsaasSubscription(input: {
  empresaId: string;
  subscriptionId?: string;
  customerId?: string;
  plano?: string | null;
  status: string;
  periodoFim: string | null;
}) {
  const admin = createAdminClient();
  const externalSubscriptionId = input.subscriptionId ? `asaas_${input.subscriptionId}` : undefined;
  const existing = await findLatestAsaasRow(admin, input.empresaId, externalSubscriptionId);
  const plano = normalizePlan(input.plano ?? existing?.plano);
  const payload = {
    provider: "asaas",
    plano,
    status: input.status,
    external_customer_id: input.customerId
      ? `asaas_${input.customerId}`
      : existing?.external_customer_id ?? null,
    external_subscription_id: externalSubscriptionId ?? existing?.external_subscription_id ?? null,
    periodo_fim: input.periodoFim,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await admin.from("assinaturas").update(payload).eq("id", existing.id);
  } else {
    await admin.from("assinaturas").insert({
      empresa_id: input.empresaId,
      periodo_inicio: new Date().toISOString(),
      ...payload,
    });
  }

  await admin.from("empresas").update({ plano }).eq("id", input.empresaId);
}

export async function handleAsaasWebhook(body: Record<string, unknown>) {
  const event = body.event as string | undefined;
  const payment = body.payment as Record<string, unknown> | undefined;
  const subscription = body.subscription as Record<string, unknown> | undefined;

  const externalReference =
    (payment?.externalReference as string | undefined) ??
    (subscription?.externalReference as string | undefined);

  if (!externalReference) {
    logger.warn({ event: "asaas_webhook_no_ref", asaasEvent: event }, "Asaas webhook sem externalReference");
    return;
  }

  const subscriptionId =
    (payment?.subscription as string | undefined) ??
    (subscription?.id as string | undefined);

  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED": {
      const dueDate = payment?.dueDate as string | undefined;
      const subscriptionData = subscriptionId ? await fetchAsaasSubscription(subscriptionId) : null;
      const periodoFim = dateOnlyToIso(subscriptionData?.nextDueDate) ?? dateOnlyToIso(dueDate);

      await saveAsaasSubscription({
        empresaId: externalReference,
        subscriptionId,
        customerId: payment?.customer as string | undefined,
        status: "active",
        periodoFim,
      });

      logger.info({ event: "asaas_payment_confirmed", empresaId: externalReference }, "Pagamento Asaas confirmado");
      break;
    }

    case "PAYMENT_OVERDUE":
    case "PAYMENT_DELETED": {
      await saveAsaasSubscription({
        empresaId: externalReference,
        subscriptionId,
        customerId: payment?.customer as string | undefined,
        status: "past_due",
        periodoFim: dateOnlyToIso(payment?.dueDate as string | undefined),
      });
      break;
    }

    case "SUBSCRIPTION_DELETED": {
      await saveAsaasSubscription({
        empresaId: externalReference,
        subscriptionId,
        status: "canceled",
        periodoFim: null,
      });
      logger.info({ event: "asaas_subscription_canceled", empresaId: externalReference }, "Assinatura Asaas cancelada");
      break;
    }

    default:
      logger.info({ event: "asaas_webhook_unhandled", asaasEvent: event }, "Evento Asaas não mapeado (ignorado)");
  }
}

export function validateAsaasWebhookToken(token: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return true;
  return token === expected;
}
