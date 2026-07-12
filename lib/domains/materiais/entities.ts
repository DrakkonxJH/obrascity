export type MaterialItem = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  minimo: number;
};

export type PedidoCompraItem = {
  id: string;
  obraId: string;
  materialNome: string;
  obraNome: string;
  fornecedor: string;
  quantidade: number;
  status: string;
  valor: number;
};

export type MaterialImportInput = {
  nome: string;
  unidade: string;
  quantidade: number;
  minimo: number;
};

export type MaterialImportResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
};

export type PurchaseOrderImportInput = {
  material: string;
  obra: string;
  fornecedor: string;
  quantidade: number;
  valor: number;
  status: string;
};

export type PurchaseOrderImportResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
};

export type PurchaseOrderInput = {
  materialId: string;
  obraId: string;
  fornecedor: string;
  quantidade: number;
  valor: number;
  status: string;
};

export type CotacaoCompraItem = {
  id: string;
  obraId: string;
  obraNome: string;
  materialId: string | null;
  materialNome: string;
  titulo: string;
  status: string;
  createdAt: string;
};

export type CotacaoFornecedorItem = {
  id: string;
  cotacaoId: string;
  fornecedor: string;
  valorUnitario: number;
  quantidade: number;
  prazoDias: number;
  selecionado: boolean;
  aprovado: boolean;
};

export type CotacaoRodadaItem = {
  id: string;
  cotacaoId: string;
  numero: number;
  objetivo: string;
  observacoes: string;
  createdAt: string;
};

export type ContratoFornecedorItem = {
  id: string;
  obraId: string;
  obraNome: string;
  cotacaoId: string;
  fornecedorId: string | null;
  status: string;
  valorTotal: number;
  prazoDias: number;
  condicoes: string;
  createdAt: string;
};

export type CreateCotacaoCompraInput = {
  obraId: string;
  materialId: string | null;
  titulo: string;
};

export type CreateCotacaoFornecedorInput = {
  cotacaoId: string;
  fornecedor: string;
  valorUnitario: number;
  quantidade: number;
  prazoDias: number;
  condicoes: string;
};

export type CreateCotacaoRodadaInput = {
  cotacaoId: string;
  objetivo: string;
  observacoes: string;
};

export type AdjudicarCotacaoInput = {
  cotacaoId: string;
  fornecedorId: string;
  statusContrato: string;
  condicoes: string;
};
