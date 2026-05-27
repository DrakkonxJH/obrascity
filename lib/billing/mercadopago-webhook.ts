import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

type AssinaturaLookup = { id: string; plano: string | null };

function normalizePlan(value: string | null | undefined) {
  const normalized = String(value ?? "starter").trim().toLowerCase();
  return normalized === "starter" || normalized === "pro" || normalized === "enterprise"
    ? normalized
    : "starter";
}

function mapMpSubscriptionStatus(status: string): string {
  switch (status) {
    case "authorized":
      return "active";
    case "pending":
      return "pending_payment";
    case "paused":
    case "cancelled":
      return "canceled";
    default:
      return "inativa";
  }
}

async function findLatestMercadoPagoRow(
  admin: ReturnType<typeof createAdminClient>,
  empresaId: string,
  externalSubscriptionId?: string,
): Promise<AssinaturaLookup | null> {
  let query = admin
    .from("assinaturas")
    .select("id, plano")
    .eq("empresa_id", empresaId)
    .eq("provider", "mercadopago")
    .order("created_at", { ascending: false })
    .limit(1);

  if (externalSubscriptionId) {
    query = query.eq("external_subscription_id", externalSubscriptionId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    logger.warn({ event: "mp_lookup_failed", empresaId, externalSubscriptionId, error: error.message }, "Falha ao localizar assinatura MP");
    return null;
  }

  return (data as AssinaturaLookup | null) ?? null;
}

async function saveMercadoPagoSubscription(input: {
  empresaId: string;
  plano: string;
  status: string;
  externalCustomerId: string;
  externalSubscriptionId: string;
  periodoFim: string | null;
}) {
  const admin = createAdminClient();
  const existing = await findLatestMercadoPagoRow(admin, input.empresaId, input.externalSubscriptionId);
  const payload = {
    provider: "mercadopago",
    plano: input.plano,
    status: input.status,
    external_customer_id: input.externalCustomerId,
    external_subscription_id: input.externalSubscriptionId,
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

  await admin.from("empresas").update({ plano: input.plano }).eq("id", input.empresaId);
}

export async function handleMercadoPagoWebhook(body: Record<string, unknown>) {
  const type = body.type as string | undefined;
  const data = body.data as { id?: string } | undefined;
  const resourceId = data?.id ?? (body.data_id as string | undefined);

  if (!resourceId) {
    logger.warn({ event: "mp_webhook_no_id", body }, "MP webhook sem ID de recurso");
    return;
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    logger.warn({ event: "mp_missing_token" }, "Webhook Mercado Pago ignorado por falta de token");
    return;
  }

  if (type === "subscription_preapproval" || type === "preapproval") {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const preapproval = (await res.json()) as {
      external_reference?: string;
      status?: string;
      payer_id?: string | number;
      next_payment_date?: string;
      metadata?: { plan?: string };
    };
    const empresaId = preapproval.external_reference;
    if (!empresaId) {
      logger.warn({ event: "mp_webhook_no_empresa", resourceId }, "MP preapproval sem external_reference");
      return;
    }

    const mappedStatus = mapMpSubscriptionStatus(String(preapproval.status ?? ""));
    const plano = normalizePlan(preapproval.metadata?.plan);
    const periodoFim = preapproval.next_payment_date
      ? new Date(preapproval.next_payment_date).toISOString()
      : null;

    await saveMercadoPagoSubscription({
      empresaId,
      plano,
      status: mappedStatus,
      externalCustomerId: `mp_${preapproval.payer_id ?? resourceId}`,
      externalSubscriptionId: `mp_${resourceId}`,
      periodoFim,
    });

    logger.info({ event: "mp_subscription_updated", empresaId, status: mappedStatus }, "Assinatura MP atualizada");
    return;
  }

  if (type === "payment") {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const payment = (await res.json()) as {
      status?: string;
      external_reference?: string;
      metadata?: { empresa_id?: string };
      payer?: { id?: string | number };
      subscription_id?: string | number;
    };
    const empresaId = payment.external_reference ?? payment.metadata?.empresa_id;
    if (!empresaId) return;

    if (payment.status === "approved") {
      const admin = createAdminClient();
      const externalSubscriptionId = payment.subscription_id ? `mp_${payment.subscription_id}` : undefined;
      const existing = await findLatestMercadoPagoRow(admin, empresaId, externalSubscriptionId);
      if (existing?.id) {
        await admin.from("assinaturas").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", existing.id);
      }

      logger.info({ event: "mp_payment_approved", empresaId, paymentId: resourceId }, "Pagamento MP aprovado");
    }
  }
}
