import type { Obra } from "@/types/domain";

export type { Obra };

export type ObraTrashItem = Obra & {
  deleted_at: string;
  deleted_by: string | null;
};

export type CreateObraInput = {
  nome: string;
  cliente: string;
  status?: Obra["status"];
};

export type UpdateObraInput = {
  nome: string;
  cliente: string;
  status: Obra["status"];
  progresso: number;
};

export type DashboardResumo = {
  total: number;
  atencao: number;
  andamento: number;
  concluidas: number;
};
