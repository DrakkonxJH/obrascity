import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import type { SubscriptionSnapshot } from "@/lib/billing/plans";

export async function getSubscriptionForCurrentTenant(): Promise<SubscriptionSnapshot | null> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("assinaturas")
    .select("plano, status, periodo_fim")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao carregar assinatura: ${error.message}`);
  }

  if (!data) return null;

  return {
    plano: data.plano as SubscriptionSnapshot["plano"],
    status: data.status as string,
    periodo_fim: (data.periodo_fim as string | null) ?? null,
  };
}
