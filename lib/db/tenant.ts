import { getCurrentUser } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

export async function getEmpresaIdFromProfile() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.empresa_id) {
    throw new Error("Perfil sem empresa vinculada");
  }

  return data.empresa_id as string;
}
