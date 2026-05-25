import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type EquipeItem = {
  id: string;
  nome: string;
  especialidade: string | null;
};

export type MembroItem = {
  id: string;
  profile_id: string | null;
  nome: string | null;
  email: string | null;
  equipe_id: string | null;
  cargo: string | null;
  crea: string | null;
};

export async function listEquipes(): Promise<EquipeItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("equipes")
    .select("id, nome, especialidade")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar equipes: ${error.message}`);
  }

  return (data ?? []) as EquipeItem[];
}

export async function listMembros(): Promise<MembroItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("membros")
    .select("id, profile_id, equipe_id, cargo, crea, profiles(nome, email)")
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(`Erro ao listar membros: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: item.id as string,
    profile_id: (item.profile_id as string | null) ?? null,
    nome: ((item.profiles as { nome?: string } | null)?.nome as string | undefined) ?? null,
    email: ((item.profiles as { email?: string } | null)?.email as string | undefined) ?? null,
    equipe_id: (item.equipe_id as string | null) ?? null,
    cargo: (item.cargo as string | null) ?? null,
    crea: (item.crea as string | null) ?? null,
  }));
}

export async function createMembro(input: {
  cargo: string;
  crea?: string;
  equipe_id?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("membros").insert({
    empresa_id: empresaId,
    cargo: input.cargo,
    crea: input.crea ?? null,
    equipe_id: input.equipe_id ?? null,
  });

  if (error) {
    throw new Error(`Erro ao criar membro: ${error.message}`);
  }
}

export async function createEquipe(input: { nome: string; especialidade?: string }) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("equipes").insert({
    empresa_id: empresaId,
    nome: input.nome,
    especialidade: input.especialidade ?? null,
  });

  if (error) {
    throw new Error(`Erro ao criar equipe: ${error.message}`);
  }
}
