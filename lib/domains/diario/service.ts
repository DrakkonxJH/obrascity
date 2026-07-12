import { IDiarioRepository } from "./repository";
import { DiarioItem, CreateDiarioInput, UploadDiarioEvidenciasInput } from "./entities";

export interface DiarioDeps {
  getEmpresaId: () => Promise<string>;
  getCurrentUser: () => Promise<any>;
  ensureObraAtiva: (obraId: string) => Promise<void>;
  listActiveObraIds: () => Promise<Set<string>>;
  decryptField: (field: string | null) => string | null;
  encryptField: (field: string | null) => string | null;
  validateUploadCollection: (files: File[], policy: any) => void;
  createAdminClient: () => any;
}

export class DiarioService {
  constructor(
    private repository: IDiarioRepository,
    private deps: DiarioDeps
  ) {}

  private get uploadPolicy() {
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

  async listDiarios(): Promise<DiarioItem[]> {
    const empresaId = await this.deps.getEmpresaId();
    const activeObraIds = await this.deps.listActiveObraIds();
    const data = await this.repository.listDiarios(empresaId);

    const rows = (data ?? [])
      .filter((item) => activeObraIds.has(item.obra_id as string))
      .map((item) => ({
        id: item.id as string,
        obraId: item.obra_id as string,
        obraNome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
        dataRef: item.data_ref as string,
        clima: (item.clima as string | null) ?? null,
        efetivo: Number(item.efetivo ?? 0),
        equipamentos: this.deps.decryptField((item.equipamentos as string | null) ?? null),
        ocorrencias: this.deps.decryptField((item.ocorrencias as string | null) ?? null),
        observacoesSsma: this.deps.decryptField((item.observacoes_ssma as string | null) ?? null),
        assinaturaUrl: (item.assinatura_url as string | null) ?? null,
        createdBy: (item.created_by as string | null) ?? null,
        createdByNome: null as string | null,
        evidencias: [] as any[],
      }));

    const createdByIds = Array.from(
      new Set(rows.map((item) => item.createdBy).filter((id): id is string => typeof id === "string" && id.length > 0))
    );

    const diarioIds = rows.map((item) => item.id);
    const [profiles, evidencias] = await Promise.all([
      createdByIds.length > 0 ? this.repository.listProfiles(empresaId, createdByIds) : Promise.resolve([]),
      diarioIds.length > 0 ? this.repository.listEvidencias(empresaId, diarioIds) : Promise.resolve([]),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p.nome as string]));
    const evidenciasByDiario = new Map<string, any[]>();
    for (const row of evidencias ?? []) {
      const diarioId = String(row.diario_id ?? "");
      if (!evidenciasByDiario.has(diarioId)) evidenciasByDiario.set(diarioId, []);
      evidenciasByDiario.get(diarioId)?.push({
        id: String(row.id ?? ""),
        diarioId: diarioId,
        arquivoUrl: String(row.arquivo_url ?? ""),
        descricao: (row.descricao as string | null) ?? null,
        mimeType: (row.mime_type as string | null) ?? null,
        sizeBytes: Number(row.size_bytes ?? 0),
        createdAt: String(row.created_at ?? ""),
      });
    }

    return rows.map((item) => ({
      ...item,
      createdByNome: item.createdBy ? (profileMap.get(item.createdBy) ?? null) : null,
      evidencias: evidenciasByDiario.get(item.id) ?? [],
    }));
  }

  async createDiario(input: CreateDiarioInput): Promise<string> {
    const [empresaId, user] = await Promise.all([this.deps.getEmpresaId(), this.deps.getCurrentUser()]);
    if (!user) throw new Error("Usuário não autenticado");

    await this.deps.ensureObraAtiva(input.obraId);

    const payload = {
      empresa_id: empresaId,
      obra_id: input.obraId,
      data_ref: input.dataRef,
      clima: input.clima ?? null,
      efetivo: input.efetivo,
      equipamentos: this.deps.encryptField(input.equipamentos ?? null),
      ocorrencias: this.deps.encryptField(input.ocorrencias ?? null),
      observacoes_ssma: this.deps.encryptField(input.observacoesSsma ?? null),
      assinatura_url: input.assinaturaUrl ?? null,
      created_by: user.id,
    };

    const result = await this.repository.upsertDiario(empresaId, payload);
    if (!result?.id) throw new Error("Erro ao salvar diário: diário sem id");
    return result.id as string;
  }

  async uploadDiarioEvidencias(input: UploadDiarioEvidenciasInput): Promise<void> {
    if (input.files.length === 0) return;
    this.deps.validateUploadCollection(input.files, this.uploadPolicy);

    const [empresaId, user] = await Promise.all([this.deps.getEmpresaId(), this.deps.getCurrentUser()]);
    if (!user) throw new Error("Usuário não autenticado");

    const admin = this.deps.createAdminClient();
    const now = Date.now();
    const rows: any[] = [];

    for (const [index, file] of input.files.entries()) {
      const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "bin" : "bin";
      const path = `${empresaId}/${input.diarioId}/${now}-${index}.${extension}`;
      const contentBuffer = Buffer.from(await file.arrayBuffer());

      const upload = await admin.storage.from("diario-evidencias").upload(path, contentBuffer, {
        contentType: file.type || undefined,
        upsert: true,
      });
      if (upload.error) throw new Error(`Erro ao enviar evidência do diário: ${upload.error.message}`);

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

    await this.repository.insertEvidencias(empresaId, rows);
  }
}
