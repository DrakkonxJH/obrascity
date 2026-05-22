import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type SecurityAlertInput = {
  category: "signup" | "login" | "upload";
  severity: "medium" | "high";
  reason: string;
  email?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizeEmail(email: string | null | undefined) {
  return email ? email.trim().toLowerCase() : null;
}

function hashIp(ip: string | null | undefined) {
  return ip ? createHash("sha256").update(ip).digest("hex") : null;
}

export async function createSecurityAlert(input: SecurityAlertInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("security_alerts").insert({
    category: input.category,
    severity: input.severity,
    reason: input.reason,
    email: normalizeEmail(input.email),
    ip_hash: hashIp(input.ip),
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Erro ao registrar alerta de segurança: ${error.message}`);
  }
}
