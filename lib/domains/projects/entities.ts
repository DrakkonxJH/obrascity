export type ProjetoDocumento = {
  id: string;
  obraId: string;
  disciplina: string;
  revisao: string;
  status: string;
  observacoes: string;
  createdAt: string;
  obraNome: string;
};

export type ProjetoConflito = {
  id: string;
  obraId: string;
  obraNome: string;
  titulo: string;
  descricao: string;
  severidade: string;
  status: string;
  prazo: string | null;
  createdAt: string;
};

export type CreateProjetoDocumentoInput = {
  obraId: string;
  disciplina: string;
  revisao: string;
  status: string;
  observacoes: string;
};

export type CreateProjetoConflitoInput = {
  obraId: string;
  titulo: string;
  descricao: string;
  severidade: string;
  prazo: string | null;
};
