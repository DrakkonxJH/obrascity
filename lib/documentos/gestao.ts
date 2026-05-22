// Gestão e OCR de Documentos

export type TipoDocumento = "nota_fiscal" | "rg" | "cpf" | "contrato" | "nf_saida" | "comprovante" | "outro";
export type StatusOCR = "pendente" | "processando" | "concluido" | "erro";

export interface Documento {
  id: string;
  obra_id: string;
  usuário_id: string;
  tipo: TipoDocumento;
  nome: string;
  url_arquivo: string;
  url_miniatura?: string;
  tamanho_bytes: number;
  mime_type: string;
  status_ocr: StatusOCR;
  dados_extraidos?: Record<string, unknown>;
  tags: string[];
  criado_em: Date;
  atualizado_em: Date;
}

export interface ExtraccaoOCR {
  id: string;
  documento_id: string;
  texto_completo: string;
  campos_extraidos: Record<string, string>;
  confianca_media: number; // 0-100
  idioma: string;
  processado_em: Date;
}

export interface PastaDocumentos {
  id: string;
  obra_id: string;
  nome: string;
  descricao?: string;
  tipos_permitidos: TipoDocumento[];
  permissoes: string[]; // roles que podem acessar
  criado_em: Date;
}

export const camposExtraidos: Record<TipoDocumento, string[]> = {
  nota_fiscal: ["numero_nf", "serie", "data_emissao", "valor_total", "cnpj_fornecedor"],
  rg: ["numero_rg", "nome", "data_nascimento", "orgao_emissor"],
  cpf: ["numero_cpf", "nome", "data_nascimento"],
  contrato: ["numero_contrato", "data_assinatura", "valor", "signatarios"],
  nf_saida: ["numero_nf", "valor_total", "destinatario", "data_saida"],
  comprovante: ["tipo_comprovante", "valor", "data_comprovacao"],
  outro: [],
};

export function validarArquivo(arquivo: File, tipoEsperado: TipoDocumento): boolean {
  const tiposValidos: Record<TipoDocumento, string[]> = {
    nota_fiscal: ["application/pdf", "image/jpeg", "image/png"],
    rg: ["application/pdf", "image/jpeg", "image/png"],
    cpf: ["application/pdf", "image/jpeg", "image/png"],
    contrato: ["application/pdf", "application/msword"],
    nf_saida: ["application/pdf", "image/jpeg"],
    comprovante: ["application/pdf", "image/jpeg", "image/png"],
    outro: ["application/pdf", "image/jpeg", "image/png"],
  };
  
  return tiposValidos[tipoEsperado].includes(arquivo.type);
}
