const CSV_MIME_TYPES = new Set(["text/csv", "application/csv", "application/vnd.ms-excel"]);

export type UploadPolicy = {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFiles: number;
  maxFileSizeBytes: number;
};

export function validateUploadCollection(files: File[], policy: UploadPolicy) {
  if (files.length === 0) {
    throw new Error("Envie ao menos um arquivo.");
  }

  if (files.length > policy.maxFiles) {
    throw new Error(`Limite excedido: envie no maximo ${policy.maxFiles} arquivo(s).`);
  }

  for (const file of files) {
    validateSingleFile(file, policy);
  }
}

export function validateSingleFile(file: File, policy: UploadPolicy) {
  const extension = getLowerExtension(file.name);
  if (!policy.allowedExtensions.includes(extension)) {
    throw new Error(`Extensao de arquivo não permitida: .${extension || "desconhecida"}.`);
  }

  if (file.size <= 0) {
    throw new Error("Arquivo vazio não e permitido.");
  }

  if (file.size > policy.maxFileSizeBytes) {
    throw new Error(`Arquivo excede o limite de ${Math.floor(policy.maxFileSizeBytes / 1024 / 1024)} MB.`);
  }

  const mimeType = file.type.trim().toLowerCase();
  if (mimeType && !policy.allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Tipo de arquivo não permitido: ${mimeType}.`);
  }
}

export async function scanCsvContent(file: File, options?: { maxRows?: number }) {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("CSV vazio.");
  }

  if (text.includes("\u0000")) {
    throw new Error("CSV invalido: conteudo binario detectado.");
  }

  if (/<script|javascript:/i.test(text)) {
    throw new Error("CSV invalido: conteudo potencialmente malicioso detectado.");
  }

  const maxRows = options?.maxRows ?? 5000;
  const rows = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (rows.length > maxRows) {
    throw new Error(`CSV excede o limite de ${maxRows} linhas.`);
  }

  return text;
}

export function csvUploadPolicy(): UploadPolicy {
  return {
    allowedExtensions: ["csv"],
    allowedMimeTypes: Array.from(CSV_MIME_TYPES),
    maxFiles: 1,
    maxFileSizeBytes: 5 * 1024 * 1024,
  };
}

function getLowerExtension(name: string) {
  const index = name.lastIndexOf(".");
  if (index < 0 || index === name.length - 1) return "";
  return name.slice(index + 1).trim().toLowerCase();
}
