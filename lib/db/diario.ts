import { getDiarioService } from "@/lib/domains/diario";
import { DiarioItem, DiarioEvidenciaItem } from "@/lib/domains/diario/entities";

export type DiarioEvidenciaItemLegacy = DiarioEvidenciaItem;
export type DiarioItemLegacy = DiarioItem;

export async function listDiarios(): Promise<DiarioItemLegacy[]> {
  const service = await getDiarioService();
  return service.listDiarios();
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
  const service = await getDiarioService();
  return service.createDiario({
    obraId: input.obra_id,
    dataRef: input.data_ref,
    clima: input.clima,
    efetivo: input.efetivo,
    equipamentos: input.equipamentos,
    ocorrencias: input.ocorrencias,
    observacoesSsma: input.observacoes_ssma,
    assinaturaUrl: input.assinatura_url,
  });
}

export async function uploadDiarioEvidencias(input: {
  diarioId: string;
  obraId: string;
  files: File[];
  descricao?: string | null;
}) {
  const service = await getDiarioService();
  return service.uploadDiarioEvidencias({
    diarioId: input.diarioId,
    obraId: input.obraId,
    files: input.files,
    descricao: input.descricao,
  });
}
