import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type Assinatura = {
  id: string;
  plano: string;
  status: string;
  periodo_fim: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
};

export async function getAssinaturaAtual(): Promise<Assinatura | null> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("assinaturas")
    .select("id, plano, status, periodo_fim, external_customer_id, external_subscription_id")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao carregar assinatura: ${error.message}`);
  }

  return (data as Assinatura | null) ?? null;
}
