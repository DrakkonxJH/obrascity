import { Job } from "bullmq";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/validations/env";

export async function processReportJob(job: Job) {
  const relatorioId =
    String(job.data?.relatorioId ?? job.data?.relatórioId ?? "").trim();

  if (!relatorioId) {
    return {
      status: "skipped",
      reason: "job-without-relatorio-id",
      name: job.name,
      data: job.data,
    };
  }

  const admin = createAdminClient();
  try {
    const { data: report, error: reportError } = await admin
      .from("relatorios")
      .select("id")
      .eq("id", relatorioId)
      .single();

    if (reportError || !report) {
      throw new Error(`Relatório não encontrado para processamento: ${reportError?.message ?? relatorioId}`);
    }

    const downloadUrl = `${getAppOrigin()}/api/relatorios/download/${relatorioId}`;
    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from("relatorios")
      .update({
        status: "concluido",
        url: downloadUrl,
        gerado_em: now,
      })
      .eq("id", relatorioId);

    if (updateError) {
      throw new Error(`Falha ao atualizar relatório concluído: ${updateError.message}`);
    }

    return {
      status: "processed",
      name: job.name,
      data: {
        ...job.data,
        relatorioId,
        url: downloadUrl,
        processedAt: now,
      },
    };
  } catch (error) {
    await admin
      .from("relatorios")
      .update({
        status: "falha",
      })
      .eq("id", relatorioId);
    throw error;
  }
}
