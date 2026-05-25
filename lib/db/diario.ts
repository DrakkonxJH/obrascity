import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentUser } from "@/lib/auth/session";
import { decryptField, encryptField } from "@/lib/security/aes256";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUploadCollection, type UploadPolicy } from "@/lib/security/file-upload";

export type DiarioEvidenciaItem = {
  id: string;
  diario_id: string;
  arquivo_url: string;
  descricao: string | null;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
};

export type DiarioItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  data_ref: string;
  clima: string | null;
  efetivo: number;
  equipamentos: string | null;
  ocorrencias: string | null;
  observacoes_ssma: string | null;
  assinatura_url: string | null;
  created_by: string | null;
  created_by_nome: string | null;
  evidencias: DiarioEvidenciaItem[];
};

function diarioEvidenceUploadPolicy(): UploadPolicy {
  return {
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf", "mp4", "mov"],
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
    ],
    maxFiles: 10,
    maxFileSizeBytes: 30 * 1024 * 1024,
  };
}

export async function listDiarios(): Promise<DiarioItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const { data, error } = await supabase
    .from("diario_obra")
    .select(
      "id, obra_id, data_ref, clima, efetivo, equipamentos, ocorrencias, observacoes_ssma, assinatura_url, created_by, obras(nome)",
    )
    .eq("empresa_id", empresaId)
    .order("data_ref", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar diarios: ${error.message}`);
  }

  const rows = (data ?? [])
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
      id: item.id as string,
      obra_id: item.obra_id as string,
      obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
      data_ref: item.data_ref as string,
      clima: (item.clima as string | null) ?? null,
      efetivo: Number(item.efetivo ?? 0),
      equipamentos: decryptField((item.equipamentos as string | null) ?? null),
      ocorrencias: decryptField((item.ocorrencias as string | null) ?? null),
      observacoes_ssma: decryptField((item.observacoes_ssma as string | null) ?? null),
      assinatura_url: (item.assinatura_url as string | null) ?? null,
      created_by: (item.created_by as string | null) ?? null,
      created_by_nome: null,
      evidencias: [],
    }));

  const createdByIds = Array.from(
    new Set(rows.map((item) => item.created_by).filter((id): id is string => typeof id === "string" && id.length > 0)),
  );

  const diarioIds = rows.map((item) => item.id);
  const [profilesResult, evidenciasResult] = await Promise.all([
    createdByIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, nome")
          .eq("empresa_id", empresaId)
          .in("id", createdByIds)
      : Promise.resolve({ data: [], error: null }),
    diarioIds.length > 0
      ? supabase
          .from("diario_evidencias")
          .select("id, diario_id, arquivo_url, descricao, mime_type, size_bytes, created_at")
          .eq("empresa_id", empresaId)
          .in("diario_id", diarioIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    throw new Error(`Erro ao listar responsáveis do diário: ${profilesResult.error.message}`);
  }
  if (evidenciasResult.error) {
    throw new Error(`Erro ao listar evidências do diário: ${evidenciasResult.error.message}`);
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id as string, profile.nome as string]));
  const evidenciasByDiario = new Map<string, DiarioEvidenciaItem[]>();
  for (const row of evidenciasResult.data ?? []) {
    const diarioId = String(row.diario_id ?? "");
    if (!evidenciasByDiario.has(diarioId)) {
      evidenciasByDiario.set(diarioId, []);
    }
    evidenciasByDiario.get(diarioId)?.push({
      id: String(row.id ?? ""),
      diario_id: diarioId,
      arquivo_url: String(row.arquivo_url ?? ""),
      descricao: (row.descricao as string | null) ?? null,
      mime_type: (row.mime_type as string | null) ?? null,
      size_bytes: Number(row.size_bytes ?? 0),
      created_at: String(row.created_at ?? ""),
    });
  }

  return rows.map((item) => ({
    ...item,
    created_by_nome: item.created_by ? (profileMap.get(item.created_by) ?? null) : null,
    evidencias: evidenciasByDiario.get(item.id) ?? [],
  }));
}

export async function createDiario(input: {
  obra_id: string;
  data_ref: string;
  clima?: string;
  efetivo: number;
  equipamentos?: string;
  ocorrencias?: string;
  observacoes_ssma?: string;
  assinatura_url?: string;
}) {
  const [empresaId, user] = await Promise.all([getEmpresaIdFromProfile(), getCurrentUser()]);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const { error, data } = await supabase
    .from("diario_obra")
    .upsert(
      {
        empresa_id: empresaId,
        obra_id: input.obra_id,
        data_ref: input.data_ref,
        clima: input.clima ?? null,
        efetivo: input.efetivo,
        equipamentos: encryptField(input.equipamentos ?? null),
        ocorrencias: encryptField(input.ocorrencias ?? null),
        observacoes_ssma: encryptField(input.observacoes_ssma ?? null),
        assinatura_url: input.assinatura_url ?? null,
        created_by: user.id,
      },
      {
        onConflict: "empresa_id,obra_id,data_ref",
      },
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Erro ao salvar diario: ${error?.message ?? "diário sem id"}`);
  }
  return data.id as string;
}

export async function uploadDiarioEvidencias(input: {
  diarioId: string;
  obraId: string;
  files: File[];
  descricao?: string | null;
}) {
  if (input.files.length === 0) {
    return;
  }
  validateUploadCollection(input.files, diarioEvidenceUploadPolicy());

  const [empresaId, user] = await Promise.all([getEmpresaIdFromProfile(), getCurrentUser()]);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const admin = createAdminClient();
  const supabase = await createServerClient();
  const now = Date.now();
  const rows: Array<Record<string, unknown>> = [];

  for (const [index, file] of input.files.entries()) {
    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "bin" : "bin";
    const path = `${empresaId}/${input.diarioId}/${now}-${index}.${extension}`;
    const contentBuffer = Buffer.from(await file.arrayBuffer());
    const upload = await admin.storage.from("diario-evidencias").upload(path, contentBuffer, {
      contentType: file.type || undefined,
      upsert: true,
    });
    if (upload.error) {
      throw new Error(`Erro ao enviar evidência do diário: ${upload.error.message}`);
    }

    const signed = await admin.storage.from("diario-evidencias").createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signed.error || !signed.data?.signedUrl) {
      throw new Error(`Erro ao assinar evidência do diário: ${signed.error?.message ?? "URL indisponível"}`);
    }

    rows.push({
      empresa_id: empresaId,
      diario_id: input.diarioId,
      obra_id: input.obraId,
      arquivo_url: signed.data.signedUrl,
      arquivo_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      descricao: input.descricao?.trim() || null,
      created_by: user.id,
    });
  }

  const { error } = await supabase.from("diario_evidencias").insert(rows);
  if (error) {
    throw new Error(`Erro ao salvar metadados de evidência do diário: ${error.message}`);
  }
}
