import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, empresa_id, nome, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao carregar perfil: ${error.message}`);
  }

  return data;
}
