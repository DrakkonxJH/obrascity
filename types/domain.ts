export type Role = "master" | "administrador" | "gestor" | "engenheiro" | "tecnico" | "visualizador";

export type ObraStatus = "planejamento" | "andamento" | "atencao" | "concluida";

export type Obra = {
  id: string;
  empresa_id: string;
  nome: string;
  cliente: string;
  status: ObraStatus;
  progresso: number;
  budgetPct?: number;
  created_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
};
