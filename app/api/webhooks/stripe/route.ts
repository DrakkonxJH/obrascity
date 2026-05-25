import { NextRequest, NextResponse } from "next/server";
import { constructStripeEvent, handleStripeEvent } from "@/lib/billing/stripe-webhook";
import { logger } from "@/lib/observability/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logTenantEvent } from "@/lib/observability/tenant-events";

function extractEmpresaIdFromStripeEvent(event: unknown): string | null {
  const object = (event as { data?: { object?: { metadata?: Record<string, unknown> } } })?.data?.object;
  const metadataEmpresaId = object?.metadata?.empresa_id;
  if (typeof metadataEmpresaId === "string" && metadataEmpresaId.length > 0) {
    return metadataEmpresaId;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await checkRateLimit({
    key: `stripe-webhook:${ip}`,
    limit: 120,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = constructStripeEvent(payload, signature);
    await handleStripeEvent(event);
    const empresaId = extractEmpresaIdFromStripeEvent(event);
    try {
      await logTenantEvent({
        empresaId,
        source: "stripe_webhook",
        eventType: event.type,
        severity: "info",
        message: "Webhook Stripe processado com sucesso.",
        metadata: { eventId: event.id },
      });
    } catch {
      // observability is best-effort and cannot block webhook processing
    }
    logger.info(
      { event: "stripe_webhook_received", eventType: event.type, eventId: event.id },
      "Stripe webhook processado",
    );
    return NextResponse.json({ ok: true, eventType: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook invalido";
    try {
      await logTenantEvent({
        empresaId: null,
        source: "stripe_webhook",
        eventType: "failed",
        severity: "error",
        message: "Falha no processamento de webhook Stripe.",
        metadata: { reason: message },
      });
    } catch {
      // observability is best-effort for webhook failures
    }
    logger.error({ event: "stripe_webhook_failed", message }, "Falha no webhook Stripe");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
