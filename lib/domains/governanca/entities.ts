export type TenantRetentionPolicy = {
  auditRetentionDays: number;
  reportRetentionDays: number;
  logRetentionDays: number;
};

export type AuditLogItem = {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  actorId: string | null;
  createdAt: string;
  diffCount: number;
};

export type TenantObservabilityEventItem = {
  id: string;
  source: string;
  eventType: string;
  severity: string;
  message: string;
  createdAt: string;
};

export type ExecutiveAlertItem = {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  details: string;
  recommendedAction: string;
};

export type UpsertRetentionPolicyInput = {
  auditRetentionDays: number;
  reportRetentionDays: number;
  logRetentionDays: number;
};

export type RegisterSyncEventInput = {
  provider: "erp" | "fiscal" | "bancario";
  scope: string;
};
