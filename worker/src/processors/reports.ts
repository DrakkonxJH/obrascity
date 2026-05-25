import { Job } from "bullmq";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/validations/env";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";

const REPORTS_BUCKET = "reports-artifacts";

type ReportRow = {
  id: string;
  empresa_id: string;
  obra_id: string | null;
  tipo: string;
  formato: string | null;
};

type ReportPayload = {
  tipo: string;
  generatedAt: string;
  obraId: string | null;
  items: Array<Record<string, unknown>>;
};

function normalizeReportFormat(value: string | null | undefined) {
  const format = String(value ?? "pdf").trim().toLowerCase();
  if (format === "excel") return "xlsx";
  if (format === "xls") return "xlsx";
  return format || "pdf";
}

function safeCsvValue(value: unknown) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  }
  return raw;
}

function toCsv(payload: ReportPayload) {
  if (payload.items.length === 0) return "sem_dados\n";
  const columns = Array.from(
    new Set(payload.items.flatMap((row) => Object.keys(row))),
  );
  const header = columns.join(",");
  const body = payload.items.map((row) => columns.map((column) => safeCsvValue(row[column])).join(","));
  return [header, ...body].join("\n");
}

async function toPdf(payload: ReportPayload) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const title = `Relatório ${payload.tipo.toUpperCase()} • ${new Date(payload.generatedAt).toLocaleString("pt-BR")}`;
  page.drawText(title, {
    x: 28,
    y: 560,
    size: 14,
    font: bold,
    color: rgb(0.12, 0.16, 0.25),
  });

  const previewRows = payload.items.slice(0, 26);
  let y = 532;
  for (const item of previewRows) {
    const line = Object.entries(item)
      .map(([key, value]) => `${key}: ${String(value ?? "")}`)
      .join(" | ")
      .slice(0, 150);
    page.drawText(line, { x: 28, y, size: 9, font, color: rgb(0.18, 0.22, 0.32) });
    y -= 18;
  }
  if (payload.items.length > previewRows.length) {
    page.drawText(
      `... ${payload.items.length - previewRows.length} registro(s) adicionais foram mantidos no XLS/CSV.`,
      { x: 28, y: 40, size: 10, font: bold, color: rgb(0.6, 0.3, 0.0) },
    );
  }

  return await pdf.save();
}

function toXlsx(payload: ReportPayload) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(payload.items);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

async function buildArtifact(payload: ReportPayload, format: string) {
  if (format === "xlsx") {
    const content = toXlsx(payload);
    return {
      extension: "xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content,
    };
  }
  if (format === "csv") {
    return {
      extension: "csv",
      contentType: "text/csv; charset=utf-8",
      content: Buffer.from(toCsv(payload), "utf-8"),
    };
  }
  if (format === "json" || format === "docx") {
    return {
      extension: "json",
      contentType: "application/json; charset=utf-8",
      content: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    };
  }
  const pdfBytes = await toPdf(payload);
  return {
    extension: "pdf",
    contentType: "application/pdf",
    content: Buffer.from(pdfBytes),
  };
}

async function loadReportPayload(admin: ReturnType<typeof createAdminClient>, report: ReportRow): Promise<ReportPayload> {
  const generatedAt = new Date().toISOString();

  if (report.tipo === "financeiro") {
    const { data, error } = await admin
      .from("obras_financeiro")
      .select("obra_id, categoria, orcado, realizado, obras(nome)")
      .eq("empresa_id", report.empresa_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Erro ao montar dataset financeiro: ${error.message}`);

    const items = (data ?? [])
      .filter((row) => !report.obra_id || row.obra_id === report.obra_id)
      .map((row) => {
        const orcado = Number(row.orcado ?? 0);
        const realizado = Number(row.realizado ?? 0);
        return {
          obra: (row.obras as { nome?: string } | null)?.nome ?? "Obra",
          categoria: row.categoria ?? "",
          orcado,
          realizado,
          saldo: orcado - realizado,
        };
      });

    return { tipo: report.tipo, generatedAt, obraId: report.obra_id, items };
  }

  if (report.tipo === "diario") {
    const { data, error } = await admin
      .from("diario_obra")
      .select("obra_id, data_ref, clima, efetivo, ocorrencias, obras(nome)")
      .eq("empresa_id", report.empresa_id)
      .order("data_ref", { ascending: false });
    if (error) throw new Error(`Erro ao montar dataset diário: ${error.message}`);

    const items = (data ?? [])
      .filter((row) => !report.obra_id || row.obra_id === report.obra_id)
      .map((row) => ({
        obra: (row.obras as { nome?: string } | null)?.nome ?? "Obra",
        data: row.data_ref,
        clima: row.clima ?? null,
        efetivo: Number(row.efetivo ?? 0),
        ocorrencias: row.ocorrencias ?? null,
      }));

    return { tipo: report.tipo, generatedAt, obraId: report.obra_id, items };
  }

  const { data, error } = await admin
    .from("obras")
    .select("id, nome, cliente, status, progresso")
    .eq("empresa_id", report.empresa_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Erro ao montar dataset de obras: ${error.message}`);

  const items = (data ?? [])
    .filter((row) => !report.obra_id || row.id === report.obra_id)
    .map((row) => ({
      obra: row.nome,
      cliente: row.cliente ?? "",
      status: row.status ?? "",
      progresso: Number(row.progresso ?? 0),
    }));

  return { tipo: report.tipo, generatedAt, obraId: report.obra_id, items };
}

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
  let runId: string | null = null;
  try {
    const { data: report, error: reportError } = await admin
      .from("relatorios")
      .select("id, empresa_id, obra_id, tipo, formato")
      .eq("id", relatorioId)
      .single();

    if (reportError || !report) {
      throw new Error(`Relatório não encontrado para processamento: ${reportError?.message ?? relatorioId}`);
    }

    const reportRow = report as ReportRow;

    const { data: run, error: runStartError } = await admin
      .from("relatorio_execucoes")
      .insert({
        empresa_id: reportRow.empresa_id,
        relatorio_id: reportRow.id,
        status: "running",
        metadata: { queueJobId: job.id ?? null, attemptsMade: job.attemptsMade ?? 0 },
      })
      .select("id")
      .single();
    if (runStartError || !run?.id) {
      throw new Error(`Erro ao iniciar execução de relatório: ${runStartError?.message ?? "sem id"}`);
    }
    runId = String(run.id);

    const payload = await loadReportPayload(admin, reportRow);
    const normalizedFormat = normalizeReportFormat(reportRow.formato);
    const artifact = await buildArtifact(payload, normalizedFormat);

    const storagePath = `${reportRow.empresa_id}/${reportRow.id}/${Date.now()}.${artifact.extension}`;
    const { error: uploadError } = await admin.storage
      .from(REPORTS_BUCKET)
      .upload(storagePath, artifact.content, {
        contentType: artifact.contentType,
        upsert: true,
      });
    if (uploadError) {
      throw new Error(`Falha ao enviar artefato para storage: ${uploadError.message}`);
    }

    const downloadUrl = `${getAppOrigin()}/api/relatorios/download/${reportRow.id}`;
    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from("relatorios")
      .update({
        status: "concluido",
        url: downloadUrl,
        storage_bucket: REPORTS_BUCKET,
        storage_path: storagePath,
        gerado_em: now,
        error_message: null,
      })
      .eq("id", reportRow.id);

    if (updateError) {
      throw new Error(`Falha ao atualizar relatório concluído: ${updateError.message}`);
    }

    const { error: runFinishError } = await admin
      .from("relatorio_execucoes")
      .update({
        status: "success",
        metadata: {
          queueJobId: job.id ?? null,
          bytes: artifact.content.byteLength,
          format: normalizedFormat,
          rowCount: payload.items.length,
          storagePath,
        },
        finished_at: now,
      })
      .eq("id", runId);
    if (runFinishError) {
      throw new Error(`Erro ao finalizar histórico de execução: ${runFinishError.message}`);
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
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await admin
      .from("relatorios")
      .update({
        status: "falha",
        error_message: message,
      })
      .eq("id", relatorioId);
    if (runId) {
      await admin
        .from("relatorio_execucoes")
        .update({
          status: "failed",
          erro: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }
    throw error;
  }
}
