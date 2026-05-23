import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listActiveObraIds, listObras } from "@/lib/db/obras";

export type MedicaoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  referencia: string;
  valor: number;
  retencao: number;
  aditivo: number;
  status: string;
};

export async function listMedicoes(): Promise<MedicaoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const { data, error } = await supabase
    .from("medicoes")
    .select("id, obra_id, referencia, valor, retencao, aditivo, status, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar medicoes: ${error.message}`);
  }

  return (data ?? [])
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
    referencia: item.referencia as string,
    valor: Number(item.valor ?? 0),
    retencao: Number(item.retencao ?? 0),
    aditivo: Number(item.aditivo ?? 0),
    status: item.status as string,
  }));
}

export async function createMedicao(input: {
  obra_id: string;
  referencia: string;
  valor: number;
  retencao: number;
  aditivo: number;
  status?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const { error } = await supabase.from("medicoes").insert({
    empresa_id: empresaId,
    obra_id: input.obra_id,
    referencia: input.referencia,
    valor: input.valor,
    retencao: input.retencao,
    aditivo: input.aditivo,
    status: input.status ?? "rascunho",
  });

  if (error) {
    throw new Error(`Erro ao criar medicao: ${error.message}`);
  }
}

export async function getEvmIndicadores() {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const [financeiro, obrasAtivas] = await Promise.all([
    supabase
      .from("obras_financeiro")
      .select("orcado, realizado")
      .eq("empresa_id", empresaId),
    listObras(),
  ]);

  if (financeiro.error) {
    throw new Error(`Erro ao calcular EVM financeiro: ${financeiro.error.message}`);
  }
  const pv = (financeiro.data ?? []).reduce((acc, row) => acc + Number(row.orcado ?? 0), 0);
  const ac = (financeiro.data ?? []).reduce((acc, row) => acc + Number(row.realizado ?? 0), 0);
  const progressoMedio =
    obrasAtivas.length > 0
      ? obrasAtivas.reduce((acc, row) => acc + Number(row.progresso ?? 0), 0) / obrasAtivas.length
      : 0;
  const ev = pv * (progressoMedio / 100);

  const cpi = ac > 0 ? ev / ac : 0;
  const spi = pv > 0 ? ev / pv : 0;
  const eac = cpi > 0 ? pv / cpi : pv;

  return {
    pv,
    ev,
    ac,
    cpi,
    spi,
    eac,
  };
}
