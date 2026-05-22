import { assertSubscriptionFeature } from "@/lib/billing/plans";
import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentUser } from "@/lib/auth/session";

export type RelatórioItem = {
  id: string;
  obra_id: string | null;
  tipo: string;
  formato: string;
  status: string;
  obra_nome: string | null;
  url: string | null;
  created_at: string;
};

export async function listRelatorios(): Promise<RelatórioItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();

  const detailed = await supabase
    .from("relatorios")
    .select("id, obra_id, tipo, formato, status, url, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  const fallback =
    detailed.error
      ? await supabase
          .from("relatorios")
          .select("id, obra_id, tipo, status, url, created_at, obras(nome)")
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false })
      : null;

  const resultError = detailed.error ? fallback?.error ?? null : detailed.error;
  if (resultError) {
    throw new Error(`Erro ao listar relatórios: ${resultError.message}`);
  }

  const rows = (detailed.error ? fallback?.data ?? [] : detailed.data ?? []) as Array<
    Record<string, unknown> & {
      id: string;
      obra_id: string | null;
      tipo: string;
      formato?: string;
      status: string;
      url: string | null;
      created_at: string;
      obras: { nome?: string } | null;
    }
  >;

  return rows
    .filter((item) => item.obra_id === null || activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: (item.obra_id as string | null) ?? null,
    tipo: item.tipo as string,
    formato: item.formato ?? "pdf",
    status: item.status as string,
    url: (item.url as string | null) ?? null,
    created_at: item.created_at as string,
    obra_nome: item.obras?.nome ?? null,
  }));
}

export async function createRelatórioRequest(input: { obra_id: string | null; tipo: string; formato?: string }) {
  const [empresaId, user, subscription] = await Promise.all([
    getEmpresaIdFromProfile(),
    getCurrentUser(),
    getSubscriptionForCurrentTenant(),
  ]);
  if (!user) throw new Error("Usuário não autenticado");

  assertSubscriptionFeature(
    subscription,
    "relatórios_basic",
    "Relatórios disponiveis apenas com assinatura trial ou plano ativo.",
  );

  const supabase = await createServerClient();
  if (input.obra_id) {
    await ensureObraAtiva(input.obra_id);
  }
  const { data, error } = await supabase
    .from("relatorios")
    .insert({
      empresa_id: empresaId,
      obra_id: input.obra_id,
      tipo: input.tipo,
      formato: input.formato ?? "pdf",
      status: "pendente",
      solicitado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Erro ao criar solicitacao de relatório: ${error?.message}`);
  }

  return data.id as string;
}
