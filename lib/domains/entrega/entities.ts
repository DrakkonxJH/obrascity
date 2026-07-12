export type ComissionamentoItem = {
  id: string;
  obraId: string;
  obraNome: string;
  sistema: string;
  ambiente: string;
  item: string;
  status: string;
  observacao: string;
  createdAt: string;
};

export type EntregaItem = {
  id: string;
  obraId: string;
  obraNome: string;
  status: string;
  chavesEntregues: boolean;
  dataEntrega: string | null;
  aceiteClienteNome: string;
  observacoes: string;
};

export type CreateComissionamentoInput = {
  obraId: string;
  sistema: string;
  ambiente: string;
  item: string;
  status: string;
  observacao: string;
};

export type UpsertEntregaInput = {
  obraId: string;
  status: string;
  chavesEntregues: boolean;
  dataEntrega: string | null;
  aceiteClienteNome: string;
  observacoes: string;
};
