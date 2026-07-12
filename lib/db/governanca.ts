import { getGovernancaService } from "@/lib/domains/governanca";
import {
  TenantRetentionPolicy,
  AuditLogItem,
  TenantObservabilityEventItem,
  ExecutiveAlertItem,
} from "@/lib/domains/governanca/entities";

export type TenantRetentionPolicyLegacy = TenantRetentionPolicy;
export type AuditLogItemLegacy = AuditLogItem;
export type TenantObservabilityEventItemLegacy = TenantObservabilityEventItem;
export type ExecutiveAlertItemLegacy = ExecutiveAlertItem;

export async function getTenantRetentionPolicy(): Promise<TenantRetentionPolicyLegacy | null> {
  const service = await getGovernancaService();
  return service.getRetentionPolicy();
}

export async function upsertTenantRetentionPolicy(input: TenantRetentionPolicy) {
  const service = await getGovernancaService();
  return service.upsertRetentionPolicy(input);
}

export async function listRecentAuditLogs(limit = 30): Promise<AuditLogItemLegacy[]> {
  const service = await getGovernancaService();
  return service.listRecentAuditLogs(limit);
}

export async function listTenantObservabilityEvents(limit = 30): Promise<TenantObservabilityEventItemLegacy[]> {
  const service = await getGovernancaService();
  return service.listObservabilityEvents(limit);
}

export async function registerExternalSyncEvent(input: {
  provider: "erp" | "fiscal" | "bancario";
  scope: string;
}) {
  const service = await getGovernancaService();
  return service.registerExternalSyncEvent(input);
}

export async function listExecutiveAlerts(limit = 8): Promise<ExecutiveAlertItemLegacy[]> {
  const service = await getGovernancaService();
  return service.listExecutiveAlerts(limit);
}
