import { createAdminClient } from "@/lib/supabase/admin";

export type TenantEventInput = {
  empresaId?: string | null;
  source: string;
  eventType: string;
  severity?: "info" | "warning" | "error";
  message: string;
  metadata?: Record<string, unknown>;
};

export async function logTenantEvent(input: TenantEventInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("tenant_observability_events").insert({
    empresa_id: input.empresaId ?? null,
    source: input.source,
    event_type: input.eventType,
    severity: input.severity ?? "info",
    message: input.message,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Erro ao registrar evento de observabilidade: ${error.message}`);
  }
}
