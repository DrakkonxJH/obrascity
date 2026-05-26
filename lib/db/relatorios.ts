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
  error_message: string | null;
  created_at: string;
};

export type RelatorioExecucaoItem = {
  id: string;
  relatorio_id: string;
  status: string;
  erro: string | null;
  started_at: string;
  finished_at: string | null;
};

export async function listRelatorios(): Promise<RelatórioItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();

  const primarySelect = "id, obra_id, tipo, formato, status, url, error_message, created_at, obras(nome)";
  const secondarySelect = "id, obra_id, tipo, status, url, error_message, created_at, obras(nome)";
  const compatibilitySelect = "id, obra_id, tipo, status, url, created_at, obras(nome)";

  const detailed = await supabase
    .from("relatorios")
    .select(primarySelect)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  let rowsSource: Array<Record<string, unknown>> = (detailed.data ?? []) as Array<Record<string, unknown>>;
  let queryError = detailed.error;

  if (queryError) {
    const fallback = await supabase
      .from("relatorios")
      .select(secondarySelect)
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    rowsSource = (fallback.data ?? []) as Array<Record<string, unknown>>;
    queryError = fallback.error;
  }

  if (queryError && queryError.message.toLowerCase().includes("error_message")) {
    const compatibility = await supabase
      .from("relatorios")
      .select(compatibilitySelect)
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    rowsSource = (compatibility.data ?? []) as Array<Record<string, unknown>>;
    queryError = compatibility.error;
  }

  if (queryError) {
    throw new Error(`Erro ao listar relatórios: ${queryError.message}`);
  }

  const rows = rowsSource as Array<
    Record<string, unknown> & {
      id: string;
      obra_id: string | null;
      tipo: string;
      formato?: string;
      status: string;
      url: string | null;
      error_message?: string | null;
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
    error_message: (item.error_message as string | null) ?? null,
    created_at: item.created_at as string,
    obra_nome: item.obras?.nome ?? null,
  }));
}

export async function listRelatorioExecucoes(limit = 50): Promise<RelatorioExecucaoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("relatorio_execucoes")
    .select("id, relatorio_id, status, erro, started_at, finished_at")
    .eq("empresa_id", empresaId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erro ao listar histórico de execução de relatórios: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: item.id as string,
    relatorio_id: item.relatorio_id as string,
    status: item.status as string,
    erro: (item.erro as string | null) ?? null,
    started_at: item.started_at as string,
    finished_at: (item.finished_at as string | null) ?? null,
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

  // Try full insert (needs migrations 0007 + 0024 columns)
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

  if (!error && data?.id) {
    return data.id as string;
  }

  // Fallback: retry with only base columns (pre-migration schema)
  const isMissingColumn =
    error &&
    (error.message.toLowerCase().includes("column") ||
      error.message.toLowerCase().includes("formato") ||
      error.message.toLowerCase().includes("status") ||
      error.message.toLowerCase().includes("solicitado_por"));

  if (isMissingColumn) {
    console.warn("[relatorios] Colunas ausentes, tentando insert com schema base.");
    const { data: data2, error: error2 } = await supabase
      .from("relatorios")
      .insert({
        empresa_id: empresaId,
        obra_id: input.obra_id,
        tipo: input.tipo,
      })
      .select("id")
      .single();

    if (error2 || !data2?.id) {
      throw new Error(`Erro ao criar solicitacao de relatório: ${error2?.message}`);
    }
    return data2.id as string;
  }

  throw new Error(`Erro ao criar solicitacao de relatório: ${error?.message}`);
}
