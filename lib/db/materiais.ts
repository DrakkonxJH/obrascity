import { getMateriaisService } from "@/lib/domains/materiais";
import {
  MaterialItem,
  PedidoCompraItem,
  MaterialImportInput,
  MaterialImportResult,
  PurchaseOrderImportInput,
  PurchaseOrderImportResult,
  PurchaseOrderInput,
  CotacaoCompraItem,
  CotacaoFornecedorItem,
  CotacaoRodadaItem,
  ContratoFornecedorItem
} from "@/lib/domains/materiais/entities";

export type MaterialItemLegacy = MaterialItem;
export type PedidoCompraItemLegacy = PedidoCompraItem;
export type MaterialImportInputLegacy = MaterialImportInput;
export type MaterialImportResultLegacy = MaterialImportResult;
export type PurchaseOrderImportInputLegacy = PurchaseOrderImportInput;
export type PurchaseOrderImportResultLegacy = PurchaseOrderImportResult;
export type PurchaseOrderInputLegacy = PurchaseOrderInput;
export type CotacaoCompraItemLegacy = CotacaoCompraItem;
export type CotacaoFornecedorItemLegacy = CotacaoFornecedorItem;
export type CotacaoRodadaItemLegacy = CotacaoRodadaItem;
export type ContratoFornecedorItemLegacy = ContratoFornecedorItem;

export async function listMateriais(): Promise<MaterialItemLegacy[]> {
  const service = await getMateriaisService();
  return service.listMateriais();
}

export async function listPedidosCompra(): Promise<PedidoCompraItemLegacy[]> {
  const service = await getMateriaisService();
  const { listActiveObraIds } = await import("@/lib/db/obras");
  const activeObraIds = await listActiveObraIds();
  return service.listPedidosCompra(activeObraIds);
}

export async function createMaterial(input: {
  nome: string;
  unidade: string;
  quantidade: number;
  mínimo: number;
}) {
  const service = await getMateriaisService();
  await service.createMaterial({
    nome: input.nome,
    unidade: input.unidade,
    quantidade: input.quantidade,
    minimo: input.mínimo,
  });
}

export async function importMaterials(rows: MaterialImportInputLegacy[]): Promise<MaterialImportResultLegacy> {
  const service = await getMateriaisService();
  return service.importMaterials(rows);
}

export async function updateMaterial(
  id: string,
  input: {
    nome: string;
    unidade: string;
    quantidade: number;
    mínimo: number;
  },
) {
  const service = await getMateriaisService();
  await service.updateMaterial(id, {
    nome: input.nome,
    unidade: input.unidade,
    quantidade: input.quantidade,
    minimo: input.mínimo,
  });
}

export async function createPurchaseOrder(input: PurchaseOrderInputLegacy) {
  const service = await getMateriaisService();
  return service.createPurchaseOrder({
    materialId: input.material_id,
    obraId: input.obra_id,
    fornecedor: input.fornecedor,
    quantidade: input.quantidade,
    valor: input.valor,
    status: input.status,
  });
}

export async function importPurchaseOrders(
  rows: PurchaseOrderImportInputLegacy[],
): Promise<PurchaseOrderImportResultLegacy> {
  const service = await getMateriaisService();
  return service.importPurchaseOrders(rows);
}

export async function listCotacoesCompra(): Promise<CotacaoCompraItemLegacy[]> {
  const service = await getMateriaisService();
  return service.listCotacoesCompra();
}

export async function createCotacaoCompra(input: {
  obraId: string;
  materialId: string | null;
  titulo: string;
}) {
  const service = await getMateriaisService();
  await service.createCotacaoCompra(input);
}

export async function listCotacoesFornecedores(): Promise<CotacaoFornecedorItemLegacy[]> {
  const service = await getMateriaisService();
  return service.listCotacoesFornecedores();
}

export async function createCotacaoFornecedor(input: {
  cotacaoId: string;
  fornecedor: string;
  valorUnitario: number;
  quantidade: number;
  prazoDias: number;
  condicoes: string;
}) {
  const service = await getMateriaisService();
  await service.createCotacaoFornecedor(input);
}

export async function listCotacaoRodadas(): Promise<CotacaoRodadaItemLegacy[]> {
  const service = await getMateriaisService();
  return service.listCotacaoRodadas();
}

export async function createCotacaoRodada(input: {
  cotacaoId: string;
  objetivo: string;
  observacoes: string;
}) {
  const service = await getMateriaisService();
  await service.createCotacaoRodada(input);
}

export async function adjudicarCotacao(input: {
  cotacaoId: string;
  fornecedorId: string;
  statusContrato: string;
  condicoes: string;
}) {
  const service = await getMateriaisService();
  await service.adjudicarCotacao(input);
}

export async function listContratosFornecedores(): Promise<ContratoFornecedorItemLegacy[]> {
  const service = await getMateriaisService();
  return service.listContratos();
}
