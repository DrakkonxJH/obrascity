import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type ComissionamentoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  sistema: string;
  ambiente: string;
  item: string;
  status: string;
  observacao: string;
  created_at: string;
};

export type EntregaItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  status: string;
  chaves_entregues: boolean;
  data_entrega: string | null;
  aceite_cliente_nome: string;
  observacoes: string;
};

export async function listComissionamento(): Promise<ComissionamentoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("comissionamento_itens")
    .select("id, obra_id, sistema, ambiente, item, status, observacao, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(`Erro ao listar comissionamento: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    sistema: String(row.sistema ?? ""),
    ambiente: String(row.ambiente ?? ""),
    item: String(row.item ?? ""),
    status: String(row.status ?? "pendente"),
    observacao: String(row.observacao ?? ""),
    created_at: String(row.created_at ?? ""),
  }));
}

export async function createComissionamento(input: {
  obraId: string;
  sistema: string;
  ambiente: string;
  item: string;
  status: string;
  observacao: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("comissionamento_itens").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    sistema: input.sistema,
    ambiente: input.ambiente,
    item: input.item,
    status: input.status,
    observacao: input.observacao,
  });

  if (error) {
    throw new Error(`Erro ao criar item de comissionamento: ${error.message}`);
  }
}

export async function listEntregas(): Promise<EntregaItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("entregas_obra")
    .select("id, obra_id, status, chaves_entregues, data_entrega, aceite_cliente_nome, observacoes, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Erro ao listar entregas: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    status: String(row.status ?? "preparacao"),
    chaves_entregues: Boolean(row.chaves_entregues),
    data_entrega: row.data_entrega ? String(row.data_entrega) : null,
    aceite_cliente_nome: String(row.aceite_cliente_nome ?? ""),
    observacoes: String(row.observacoes ?? ""),
  }));
}

export async function upsertEntrega(input: {
  obraId: string;
  status: string;
  chavesEntregues: boolean;
  dataEntrega: string | null;
  aceiteClienteNome: string;
  observacoes: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("entregas_obra").upsert(
    {
      empresa_id: empresaId,
      obra_id: input.obraId,
      status: input.status,
      chaves_entregues: input.chavesEntregues,
      data_entrega: input.dataEntrega,
      aceite_cliente_nome: input.aceiteClienteNome,
      observacoes: input.observacoes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,obra_id" },
  );

  if (error) {
    throw new Error(`Erro ao salvar entrega da obra: ${error.message}`);
  }
}

