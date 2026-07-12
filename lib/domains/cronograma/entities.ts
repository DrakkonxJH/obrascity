export type CronogramaItem = {
  id: string;
  obraId: string;
  obraNome: string;
  nome: string;
  inicio: string;
  fim: string;
  status: string;
  updatedAt: string | null;
};

export type CronogramaDependencia = {
  id: string;
  tarefaPredecessoraId: string;
  tarefaSucessoraId: string;
  tipo: string;
};

export type ReplanejamentoItem = {
  id: string;
  obraId: string;
  obraNome: string;
  motivo: string;
  impactoPrazoDias: number;
  impactoCusto: number;
  status: string;
  createdAt: string;
};

export type CaminhoCriticoItem = {
  tarefaId: string;
  obraId: string;
  obraNome: string;
  nome: string;
  inicio: string;
  fim: string;
  duracaoDias: number;
  dependencias: number;
};

export type CronogramaBaselineItem = {
  tarefaId: string;
  obraId: string;
  baselineInicio: string;
  baselineFim: string;
  versao: number;
};

export type CreateTarefaInput = {
  obraId: string;
  nome: string;
  inicio: string;
  fim: string;
  status?: string;
};

export type UpdateTarefaInput = {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  status: string;
};

export type CreateDependenciaInput = {
  tarefaPredecessoraId: string;
  tarefaSucessoraId: string;
  tipo?: string;
};

export type CreateReplanejamentoInput = {
  obraId: string;
  motivo: string;
  impactoPrazoDias: number;
  impactoCusto: number;
  status?: string;
};
