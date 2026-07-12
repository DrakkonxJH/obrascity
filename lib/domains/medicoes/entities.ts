export type MedicaoItem = {
  id: string;
  obraId: string;
  obraNome: string;
  referencia: string;
  valor: number;
  retencao: number;
  aditivo: number;
  status: string;
};

export type CreateMedicaoInput = {
  obraId: string;
  referencia: string;
  valor: number;
  retencao: number;
  aditivo: number;
  status?: string;
};

export type EvmIndicadores = {
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  eac: number;
};
