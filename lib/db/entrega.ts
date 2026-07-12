import { getEntregaService } from "@/lib/domains/entrega";
import { ComissionamentoItem, EntregaItem } from "@/lib/domains/entrega/entities";

export type ComissionamentoItemLegacy = ComissionamentoItem;
export type EntregaItemLegacy = EntregaItem;

export async function listComissionamento(): Promise<ComissionamentoItemLegacy[]> {
  const service = await getEntregaService();
  return service.listComissionamento();
}

export async function createComissionamento(input: {
  obraId: string;
  sistema: string;
  ambiente: string;
  item: string;
  status: string;
  observacao: string;
}) {
  const service = await getEntregaService();
  return service.createComissionamento(input);
}

export async function listEntregas(): Promise<EntregaItemLegacy[]> {
  const service = await getEntregaService();
  return service.listEntregas();
}

export async function upsertEntrega(input: {
  obraId: string;
  status: string;
  chavesEntregues: boolean;
  dataEntrega: string | null;
  aceiteClienteNome: string;
  observacoes: string;
}) {
  const service = await getEntregaService();
  return service.upsertEntrega(input);
}
