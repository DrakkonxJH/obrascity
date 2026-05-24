import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type Assinatura = {
  id: string;
  plano: string;
  status: string;
  periodo_fim: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  created_at?: string;
};

function pickCurrentAssinatura(rows: Assinatura[]): Assinatura | null {
  const activeRows = rows.filter((row) => ["active", "trialing"].includes(String(row.status).toLowerCase()));
  return (activeRows[0] ?? rows[0] ?? null) as Assinatura | null;
}

export async function getAssinaturaAtual(): Promise<Assinatura | null> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("assinaturas")
    .select("id, plano, status, periodo_fim, external_customer_id, external_subscription_id, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar assinatura: ${error.message}`);
  }

  return pickCurrentAssinatura((data ?? []) as Assinatura[]);
}
