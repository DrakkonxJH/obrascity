export type DiarioEvidenciaItem = {
  id: string;
  diarioId: string;
  arquivoUrl: string;
  descricao: string | null;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
};

export type DiarioItem = {
  id: string;
  obraId: string;
  obraNome: string;
  dataRef: string;
  clima: string | null;
  efetivo: number;
  equipamentos: string | null;
  ocorrencias: string | null;
  observacoesSsma: string | null;
  assinaturaUrl: string | null;
  createdBy: string | null;
  createdByNome: string | null;
  evidencias: DiarioEvidenciaItem[];
};

export type CreateDiarioInput = {
  obraId: string;
  dataRef: string;
  clima?: string;
  efetivo: number;
  equipamentos?: string;
  ocorrencias?: string;
  observacoesSsma?: string;
  assinaturaUrl?: string;
};

export type UploadDiarioEvidenciasInput = {
  diarioId: string;
  obraId: string;
  files: File[];
  descricao?: string | null;
};
