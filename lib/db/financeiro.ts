import { getFinanceService } from "@/lib/domains/finance";
import { FinanceiroItem } from "@/lib/domains/finance/entities";

export type FinanceiroItemLegacy = FinanceiroItem;

export async function listFinanceiro(): Promise<FinanceiroItemLegacy[]> {
  const service = await getFinanceService();
  return service.listFinanceiro();
}

export async function createFinanceiroItem(input: {
  obra_id: string;
  categoria: string;
  orcado: number;
  realizado: number;
}) {
  const service = await getFinanceService();
  await service.createFinanceiroItem({
    obraId: input.obra_id,
    categoria: input.categoria,
    orcado: input.orcado,
    realizado: input.realizado,
  });
}

export async function updateFinanceiroItem(input: {
  id: string;
  obra_id: string;
  categoria: string;
  orcado: number;
  realizado: number;
}) {
  const service = await getFinanceService();
  await service.updateFinanceiroItem({
    id: input.id,
    obraId: input.obra_id,
    categoria: input.categoria,
    orcado: input.orcado,
    realizado: input.realizado,
  });
}
