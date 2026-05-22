import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type NotificacaoItem = {
  id: string;
  titulo: string;
  lida: boolean;
  link: string | null;
  created_at: string;
};

export async function listNotificacoes(limit = 8): Promise<NotificacaoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("notificacoes")
    .select("id, titulo, lida, link, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as NotificacaoItem[];
}
