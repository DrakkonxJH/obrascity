import { NextRequest, NextResponse } from "next/server";
import { constructStripeEvent, handleStripeEvent } from "@/lib/billing/stripe-webhook";
import { logger } from "@/lib/observability/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";

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
    logger.info(
      { event: "stripe_webhook_received", eventType: event.type, eventId: event.id },
      "Stripe webhook processado",
    );
    return NextResponse.json({ ok: true, eventType: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook invalido";
    logger.error({ event: "stripe_webhook_failed", message }, "Falha no webhook Stripe");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
