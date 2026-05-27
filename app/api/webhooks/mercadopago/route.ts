import { NextRequest, NextResponse } from "next/server";
import { handleMercadoPagoWebhook } from "@/lib/billing/mercadopago-webhook";
import { logger } from "@/lib/observability/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await checkRateLimit({ key: `mp-webhook:${ip}`, limit: 120, windowSeconds: 60 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await handleMercadoPagoWebhook(body);
    logger.info({ event: "mp_webhook_received", type: body.type }, "Webhook Mercado Pago processado");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro no webhook";
    logger.error({ event: "mp_webhook_failed", message }, "Falha no webhook Mercado Pago");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
