import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/auth/roles";

export type EmpresaProfileItem = {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  role: ProfileRole;
  created_at: string;
};

export async function listEmpresaProfiles(): Promise<EmpresaProfileItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email, cargo, role, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar perfis da empresa: ${error.message}`);
  }

  return (data ?? []) as EmpresaProfileItem[];
}
