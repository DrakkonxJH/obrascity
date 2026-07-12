import { getMedicoesService } from "@/lib/domains/medicoes";
import { MedicaoItem, EvmIndicadores } from "@/lib/domains/medicoes/entities";

export type MedicaoItemLegacy = MedicaoItem;

export async function listMedicoes(): Promise<MedicaoItemLegacy[]> {
  const service = await getMedicoesService();
  const { listActiveObraIds } = await import("@/lib/db/obras");
  const activeObraIds = await listActiveObraIds();
  return service.listMedicoes(activeObraIds);
}

export async function createMedicao(input: {
  obra_id: string;
  referencia: string;
  valor: number;
  retencao: number;
  aditivo: number;
  status?: string;
}) {
  const service = await getMedicoesService();
  return service.createMedicao({
    obraId: input.obra_id,
    referencia: input.referencia,
    valor: input.valor,
    retencao: input.retencao,
    aditivo: input.aditivo,
    status: input.status,
  });
}

export async function getEvmIndicadores(): Promise<EvmIndicadores> {
  const service = await getMedicoesService();
  return service.getEvmIndicadores();
}
