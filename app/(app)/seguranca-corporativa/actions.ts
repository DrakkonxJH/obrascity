"use server";

import { revalidatePath } from "next/cache";
import { revokeTenantSession, upsertTenantSecurityPolicy } from "@/lib/db/seguranca-corporativa";

export async function saveTenantSecurityPolicyAction(formData: FormData) {
  const mfaRoles = formData
    .getAll("mfa_roles")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const ssoEnabled = String(formData.get("sso_enabled") ?? "") === "on";
  const ssoProvider = String(formData.get("sso_provider") ?? "").trim();
  const ssoEntrypoint = String(formData.get("sso_entrypoint") ?? "").trim();
  const sessionTimeout = Number(formData.get("session_timeout_minutes") ?? 43200);

  await upsertTenantSecurityPolicy({
    mfa_required_roles: mfaRoles,
    sso_enabled: ssoEnabled,
    sso_provider: ssoProvider,
    sso_entrypoint: ssoEntrypoint,
    session_timeout_minutes: sessionTimeout,
  });

  revalidatePath("/seguranca-corporativa");
}

export async function revokeTenantSessionAction(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) {
    throw new Error("Sessão obrigatória para revogação");
  }

  await revokeTenantSession(sessionId);
  revalidatePath("/seguranca-corporativa");
}

