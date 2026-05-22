import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";

export type FinanceiroItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  categoria: string;
  orcado: number;
  realizado: number;
};

export async function listFinanceiro(): Promise<FinanceiroItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const { data, error } = await supabase
    .from("obras_financeiro")
    .select("id, obra_id, categoria, orcado, realizado, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar financeiro: ${error.message}`);
  }

  return (data ?? [])
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra sem nome",
    categoria: item.categoria as string,
    orcado: Number(item.orcado ?? 0),
    realizado: Number(item.realizado ?? 0),
  }));
}

export async function createFinanceiroItem(input: {
  obra_id: string;
  categoria: string;
  orcado: number;
  realizado: number;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);

  const { error } = await supabase.from("obras_financeiro").insert({
    empresa_id: empresaId,
    obra_id: input.obra_id,
    categoria: input.categoria,
    orcado: input.orcado,
    realizado: input.realizado,
  });

  if (error) {
    throw new Error(`Erro ao criar lancamento financeiro: ${error.message}`);
  }
}
