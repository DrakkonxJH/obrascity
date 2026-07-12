export type FinanceiroItem = {
  id: string;
  obraId: string;
  obraNome: string;
  categoria: string;
  orcado: number;
  realizado: number;
};

export type FinanceiroInput = {
  obraId: string;
  categoria: string;
  orcado: number;
  realizado: number;
};

export type FinanceiroUpdateInput = {
  id: string;
  obraId: string;
  categoria: string;
  orcado: number;
  realizado: number;
};
