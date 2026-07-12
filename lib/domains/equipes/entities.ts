export type EquipeItem = {
  id: string;
  nome: string;
  especialidade: string | null;
};

export type MembroItem = {
  id: string;
  profileId: string | null;
  nome: string | null;
  email: string | null;
  equipeId: string | null;
  equipe_id: string | null;
  cargo: string | null;
  crea: string | null;
};

export type CreateEquipeInput = {
  nome: string;
  especialidade?: string;
};

export type CreateMembroInput = {
  cargo: string;
  crea?: string;
  equipeId?: string;
};
