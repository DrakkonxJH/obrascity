import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export type FinanceiroTituloItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  tipo: "ap" | "ar";
  centro_custo: string;
  descricao: string;
  valor: number;
  valor_liquidado: number;
  status: string;
  vencimento: string;
  conciliado: boolean;
};

export type FluxoCaixaItem = {
  referencia: string;
  a_pagar: number;
  a_receber: number;
  saldo: number;
};

export async function listFinanceiroTitulos(): Promise<FinanceiroTituloItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("financeiro_titulos")
    .select("id, obra_id, tipo, centro_custo, descricao, valor, valor_liquidado, status, vencimento, conciliado, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("vencimento", { ascending: true })
    .limit(500);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    tipo: String(row.tipo ?? "ap") === "ar" ? "ar" : "ap",
    centro_custo: String(row.centro_custo ?? ""),
    descricao: String(row.descricao ?? ""),
    valor: Number(row.valor ?? 0),
    valor_liquidado: Number(row.valor_liquidado ?? 0),
    status: String(row.status ?? "previsto"),
    vencimento: String(row.vencimento ?? ""),
    conciliado: Boolean(row.conciliado),
  }));
}

export async function createFinanceiroTitulo(input: {
  obraId: string;
  tipo: "ap" | "ar";
  centroCusto: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("financeiro_titulos")
    .insert({
      empresa_id: empresaId,
      obra_id: input.obraId,
      tipo: input.tipo,
      centro_custo: input.centroCusto,
      descricao: input.descricao,
      valor: input.valor,
      vencimento: input.vencimento,
      status: input.status,
      solicitado_por: profile?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Erro ao criar título financeiro: ${error?.message ?? "sem id retornado"}`);
  }
  return String(data.id);
}

export async function settleFinanceiroTitulo(input: {
  tituloId: string;
  valorLiquidado: number;
  conciliado: boolean;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("financeiro_titulos")
    .update({
      status: "liquidado",
      valor_liquidado: input.valorLiquidado,
      conciliado: input.conciliado,
      liquidado_em: new Date().toISOString(),
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.tituloId)
    .select("id");

  if (error || !data?.length) {
    throw new Error(`Erro ao liquidar título financeiro: ${error?.message ?? "título não encontrado"}`);
  }
}

export async function updateFinanceiroTituloApproval(input: {
  tituloId: string;
  status: "aprovado" | "rejeitado";
  approverId: string | null;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("financeiro_titulos")
    .update({
      status: input.status,
      aprovado_por: input.approverId,
      aprovado_em: new Date().toISOString(),
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.tituloId)
    .select("id");

  if (error || !data?.length) {
    throw new Error(`Erro ao atualizar aprovação do título: ${error?.message ?? "título não encontrado"}`);
  }
}

export async function listFluxoCaixaMensal(): Promise<FluxoCaixaItem[]> {
  const titulos = await listFinanceiroTitulos();
  const bucket = new Map<string, { ap: number; ar: number }>();
  for (const titulo of titulos) {
    const month = titulo.vencimento ? titulo.vencimento.slice(0, 7) : "sem-data";
    const current = bucket.get(month) ?? { ap: 0, ar: 0 };
    if (titulo.status === "rejeitado") continue;
    if (titulo.tipo === "ap") {
      current.ap += titulo.valor;
    } else {
      current.ar += titulo.valor;
    }
    bucket.set(month, current);
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([referencia, values]) => ({
      referencia,
      a_pagar: values.ap,
      a_receber: values.ar,
      saldo: values.ar - values.ap,
    }));
}

