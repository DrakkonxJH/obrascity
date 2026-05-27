import { NextRequest, NextResponse } from "next/server";
import { handleAsaasWebhook, validateAsaasWebhookToken } from "@/lib/billing/asaas-webhook";
import { logger } from "@/lib/observability/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await checkRateLimit({ key: `asaas-webhook:${ip}`, limit: 120, windowSeconds: 60 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const token = request.headers.get("asaas-access-token") ?? request.nextUrl.searchParams.get("token");
  if (!validateAsaasWebhookToken(token)) {
    logger.warn({ event: "asaas_webhook_invalid_token" }, "Webhook Asaas com token inválido");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await handleAsaasWebhook(body);
    logger.info({ event: "asaas_webhook_received", asaasEvent: body.event }, "Webhook Asaas processado");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro no webhook";
    logger.error({ event: "asaas_webhook_failed", message }, "Falha no webhook Asaas");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
