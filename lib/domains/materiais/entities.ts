export type MaterialItem = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  minimo: number;
  mínimo: number;
};

export type PedidoCompraItem = {
  id: string;
  obraId: string;
  obra_id?: string;
  materialNome: string;
  material_nome: string;
  obraNome: string;
  obra_nome?: string;
  fornecedor: string;
  quantidade: number;
  status: string;
  valor: number;
};

export type MaterialImportInput = {
  nome: string;
  unidade: string;
  quantidade: number;
  minimo?: number;
  mínimo?: number;
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
  obra_id?: string;
  obraNome: string;
  obra_nome?: string;
  materialId: string | null;
  material_id?: string | null;
  materialNome: string;
  material_nome: string;
  titulo: string;
  status: string;
  createdAt: string;
  created_at?: string;
};

export type CotacaoFornecedorItem = {
  id: string;
  cotacaoId: string;
  cotacao_id: string;
  fornecedor: string;
  valorUnitario: number;
  valor_unitario?: number;
  quantidade: number;
  prazoDias: number;
  prazo_dias?: number;
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
  obra_id?: string;
  obraNome: string;
  obra_nome?: string;
  cotacaoId: string;
  cotacao_id?: string;
  fornecedorId: string | null;
  fornecedor_id?: string | null;
  status: string;
  valorTotal: number;
  valor_total: number;
  prazoDias: number;
  prazo_dias: number;
  condicoes: string;
  createdAt: string;
  created_at?: string;
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
