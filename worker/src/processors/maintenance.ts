import { Job } from "bullmq";
import { createAdminClient } from "@/lib/supabase/admin";

export async function processMaintenanceJob(job: Job) {
  const admin = createAdminClient();
  const { data: policies, error: policyError } = await admin
    .from("tenant_retention_policies")
    .select("empresa_id, audit_retention_days, report_retention_days")
    .limit(1000);

  if (policyError) {
    throw new Error(`Falha ao carregar políticas de retenção: ${policyError.message}`);
  }

  let purgedAudit = 0;
  let purgedReports = 0;

  for (const policy of policies ?? []) {
    const empresaId = policy.empresa_id as string;
    const auditRetentionDays = Number(policy.audit_retention_days ?? 365);
    const reportRetentionDays = Number(policy.report_retention_days ?? 365);
    const auditCutoff = new Date(Date.now() - auditRetentionDays * 24 * 60 * 60 * 1000).toISOString();
    const reportCutoff = new Date(Date.now() - reportRetentionDays * 24 * 60 * 60 * 1000).toISOString();

    const [auditDelete, reportDelete] = await Promise.all([
      admin
        .from("audit_logs")
        .delete()
        .eq("empresa_id", empresaId)
        .lt("created_at", auditCutoff),
      admin
        .from("relatorios")
        .delete()
        .eq("empresa_id", empresaId)
        .lt("created_at", reportCutoff),
    ]);

    if (auditDelete.error) {
      throw new Error(`Falha ao expurgar auditoria (${empresaId}): ${auditDelete.error.message}`);
    }
    if (reportDelete.error) {
      throw new Error(`Falha ao expurgar relatórios (${empresaId}): ${reportDelete.error.message}`);
    }

    purgedAudit += auditDelete.count ?? 0;
    purgedReports += reportDelete.count ?? 0;
  }

  return {
    status: "processed",
    type: "maintenance",
    payload: {
      ...job.data,
      tenantsProcessed: (policies ?? []).length,
      purgedAudit,
      purgedReports,
    },
  };
}
