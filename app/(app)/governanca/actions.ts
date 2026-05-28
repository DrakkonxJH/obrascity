"use server";

import { revalidatePath } from "next/cache";
import { approveRequest, rejectRequest } from "@/lib/db/approvals";
import { registerExternalSyncEvent, upsertTenantRetentionPolicy } from "@/lib/db/governanca";

function parseRetentionDays(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 30 || parsed > 3650) {
    throw new Error(`${label} deve ficar entre 30 e 3650 dias.`);
  }
  return Math.round(parsed);
}

export async function approveRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approval_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!approvalId) {
    throw new Error("Solicitação inválida para aprovação.");
  }

  await approveRequest({ approvalId, note: note || undefined });
  revalidatePath("/governanca");
  revalidatePath("/materiais");
  revalidatePath("/financeiro");
}

export async function rejectRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approval_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!approvalId) {
    throw new Error("Solicitação inválida para rejeição.");
  }

  await rejectRequest({ approvalId, note: note || undefined });
  revalidatePath("/governanca");
  revalidatePath("/materiais");
  revalidatePath("/financeiro");
}

export async function saveRetentionPolicyAction(formData: FormData) {
  const auditRetentionDays = parseRetentionDays(formData.get("audit_retention_days"), "Retenção de auditoria");
  const reportRetentionDays = parseRetentionDays(formData.get("report_retention_days"), "Retenção de relatórios");
  const logRetentionDays = parseRetentionDays(formData.get("log_retention_days"), "Retenção de logs");

  await upsertTenantRetentionPolicy({
    auditRetentionDays,
    reportRetentionDays,
    logRetentionDays,
  });

  revalidatePath("/governanca");
}

export async function requestExternalSyncAction(formData: FormData) {
  const provider = String(formData.get("provider") ?? "").trim() as "erp" | "fiscal" | "bancario";
  const scope = String(formData.get("scope") ?? "geral").trim();
  if (!["erp", "fiscal", "bancario"].includes(provider)) {
    throw new Error("Provedor de integração inválido.");
  }
  await registerExternalSyncEvent({
    provider,
    scope: scope || "geral",
  });
  revalidatePath("/governanca");
}
