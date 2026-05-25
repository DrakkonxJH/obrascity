import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
import { getCurrentUser } from "@/lib/auth/session";
export type MaterialItem = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  mínimo: number;
};
export type PedidoCompraItem = {
  id: string;
  obra_id: string;
  material_nome: string;
  obra_nome: string;
  fornecedor: string;
  quantidade: number;
  status: string;
  valor: number;
};
export type MaterialImportInput = {
  nome: string;
  unidade: string;
  quantidade: number;
  mínimo: number;
};
export type MaterialImportResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
};
export type PurchaseOrderImportInput = {
  material: string;
  obra: string;
  fornecedor: string;
  quantidade: number;
  valor: number;
  status: string;
};
export type PurchaseOrderImportResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
};
export type PurchaseOrderInput = {
  material_id: string;
  obra_id: string;
  fornecedor: string;
  quantidade: number;
  valor: number;
  status: string;
};

export type CotacaoCompraItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  material_id: string | null;
  material_nome: string;
  titulo: string;
  status: string;
  created_at: string;
};

export type CotacaoFornecedorItem = {
  id: string;
  cotacao_id: string;
  fornecedor: string;
  valor_unitario: number;
  quantidade: number;
  prazo_dias: number;
  selecionado: boolean;
  aprovado: boolean;
};

export type CotacaoRodadaItem = {
  id: string;
  cotacao_id: string;
  numero: number;
  objetivo: string;
  observacoes: string;
  created_at: string;
};

export type ContratoFornecedorItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  cotacao_id: string;
  fornecedor_id: string | null;
  status: string;
  valor_total: number;
  prazo_dias: number;
  condicoes: string;
  created_at: string;
};
export async function listMateriais(): Promise<MaterialItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("materiais")
    .select("id, nome, unidade, quantidade, minimo")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });
  if (error) {
    throw new Error(`Erro ao listar materiais: ${error.message}`);
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows.map((item) => ({
    id: item.id as string,
    nome: item.nome as string,
    unidade: item.unidade as string,
    quantidade: Number(item.quantidade ?? 0),
    mínimo: Number(item.minimo ?? 0),
  }));
}
export async function listPedidosCompra(): Promise<PedidoCompraItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const activeObraIds = await listActiveObraIds();

  const supabase = await createServerClient();
  const detailed = await supabase
    .from("pedidos_compra")
    .select("id, obra_id, status, valor, quantidade, fornecedor, materiais(nome), obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  const fallback =
    detailed.error
      ? await supabase
          .from("pedidos_compra")
          .select("id, obra_id, status, valor, materiais(nome), obras(nome)")
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false })
      : null;
  const resultError = detailed.error ? fallback?.error ?? null : detailed.error;
  if (resultError) {
    throw new Error(`Erro ao listar pedidos de compra: ${resultError.message}`);
  }
  const rows = (detailed.error ? fallback?.data ?? [] : detailed.data ?? []) as Array<
    Record<string, unknown> & {
      id: string;
      obra_id: string;
      status: string;
      valor: number | null;
      materiais: { nome?: string } | null;
      obras: { nome?: string } | null;
      fornecedor?: string;
      quantidade?: number;
    }
  >;
  return rows
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    material_nome: item.materiais?.nome ?? "Material",
    obra_nome: item.obras?.nome ?? "Obra",
    fornecedor: item.fornecedor ?? "",
    quantidade: Number(item.quantidade ?? 0),
    status: item.status as string,
    valor: Number(item.valor ?? 0),
  }));
}
export async function createMaterial(input: {
  nome: string;
  unidade: string;
  quantidade: number;
  mínimo: number;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("materiais").insert({
    empresa_id: empresaId,
    nome: input.nome,
    unidade: input.unidade,
    quantidade: input.quantidade,
    minimo: input.mínimo,
  });
  if (error) {
    throw new Error(`Erro ao criar material: ${error.message}`);
  }
}
function materialKey(nome: string, unidade: string) {
  return `${nome.trim().toLowerCase()}|${unidade.trim().toLowerCase()}`;
}
function orderKey(materialId: string, obraId: string) {
  return `${materialId}|${obraId}`;
}
export async function importMaterials(rows: MaterialImportInput[]): Promise<MaterialImportResult> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("materiais")
    .select("id, nome, unidade")
    .eq("empresa_id", empresaId);
  if (existingError) {
    throw new Error(`Erro ao preparar importacao de materiais: ${existingError.message}`);
  }
  const existingByKey = new Map(
    (existing ?? []).map((item) => [materialKey(item.nome as string, item.unidade as string), item.id as string]),
  );
  const dedupedRows = new Map<string, MaterialImportInput>();
  for (const row of rows) {
    const key = materialKey(row.nome, row.unidade);
    dedupedRows.set(key, row);
  }
  let created = 0;
  let updated = 0;
  for (const row of dedupedRows.values()) {
    const key = materialKey(row.nome, row.unidade);
    const existingId = existingByKey.get(key);
    if (existingId) {
      const { error } = await supabase
        .from("materiais")
        .update({
          nome: row.nome,
          unidade: row.unidade,
          quantidade: row.quantidade,
          minimo: row.mínimo,
        })
        .eq("id", existingId)
        .eq("empresa_id", empresaId);
      if (error) {
        throw new Error(`Erro ao atualizar material importado: ${error.message}`);
      }
      updated += 1;
      continue;
    }
    const { error } = await supabase.from("materiais").insert({
      empresa_id: empresaId,
      nome: row.nome,
      unidade: row.unidade,
      quantidade: row.quantidade,
      minimo: row.mínimo,
    });
    if (error) {
      throw new Error(`Erro ao inserir material importado: ${error.message}`);
    }
    created += 1;
  }
  return {
    created,
    updated,
    skipped: rows.length - dedupedRows.size,
    total: rows.length,
  };
}
export async function updateMaterial(
  id: string,
  input: {
    nome: string;
    unidade: string;
    quantidade: number;
    mínimo: number;
  },
) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("materiais")
    .update({
      nome: input.nome,
      unidade: input.unidade,
      quantidade: input.quantidade,
      minimo: input.mínimo,
    })
    .eq("id", id)
    .eq("empresa_id", empresaId);
  if (error) {
    throw new Error(`Erro ao atualizar material: ${error.message}`);
  }
}
export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const { error, data } = await supabase
    .from("pedidos_compra")
    .insert({
      empresa_id: empresaId,
      material_id: input.material_id,
      obra_id: input.obra_id,
      fornecedor: input.fornecedor,
      quantidade: input.quantidade,
      valor: input.valor,
      status: input.status,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`Erro ao criar pedido de compra: ${error?.message ?? "pedido não retornou id"}`);
  }
  return data.id as string;
}
function normalizeLookup(value: string) {
  return value.trim().toLowerCase();
}
export async function importPurchaseOrders(
  rows: PurchaseOrderImportInput[],
): Promise<PurchaseOrderImportResult> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const [{ data: materials, error: materialsError }, { data: obras, error: obrasError }, {
    data: existingOrders,
    error: ordersError,
  }] = await Promise.all([
    supabase.from("materiais").select("id, nome").eq("empresa_id", empresaId),
    supabase.from("obras").select("id, nome").eq("empresa_id", empresaId).is("deleted_at", null),
    supabase
      .from("pedidos_compra")
      .select("id, material_id, obra_id")
      .eq("empresa_id", empresaId),
  ]);
  if (materialsError) {
    throw new Error(`Erro ao preparar importacao de pedidos: ${materialsError.message}`);
  }
  if (obrasError) {
    throw new Error(`Erro ao preparar importacao de pedidos: ${obrasError.message}`);
  }
  if (ordersError) {
    throw new Error(`Erro ao preparar importacao de pedidos: ${ordersError.message}`);
  }
  const materialsByName = new Map(
    (materials ?? []).map((item) => [normalizeLookup(item.nome as string), item.id as string]),
  );
  const obrasByName = new Map(
    (obras ?? []).map((item) => [normalizeLookup(item.nome as string), item.id as string]),
  );
  const existingByKey = new Map(
    (existingOrders ?? []).map((item) => [
      orderKey(item.material_id as string, item.obra_id as string),
      item.id as string,
    ]),
  );
  const dedupedRows = new Map<string, PurchaseOrderImportInput>();
  for (const row of rows) {
    const key = `${normalizeLookup(row.material)}|${normalizeLookup(row.obra)}`;
    dedupedRows.set(key, row);
  }
  let created = 0;
  let updated = 0;
  let skipped = rows.length - dedupedRows.size;
  for (const row of dedupedRows.values()) {
    const materialId = materialsByName.get(normalizeLookup(row.material));
    const obraId = obrasByName.get(normalizeLookup(row.obra));
    if (!materialId || !obraId) {
      skipped += 1;
      continue;
    }
    const existingId = existingByKey.get(orderKey(materialId, obraId));
    const payload = {
      empresa_id: empresaId,
      material_id: materialId,
      obra_id: obraId,
      fornecedor: row.fornecedor,
      quantidade: row.quantidade,
      valor: row.valor,
      status: row.status,
    };
    if (existingId) {
      const { error } = await supabase
        .from("pedidos_compra")
        .update(payload)
        .eq("id", existingId)
        .eq("empresa_id", empresaId);
      if (error) {
        throw new Error(`Erro ao atualizar pedido importado: ${error.message}`);
      }
      updated += 1;
      continue;
    }
    const { error } = await supabase.from("pedidos_compra").insert(payload);
    if (error) {
      throw new Error(`Erro ao inserir pedido importado: ${error.message}`);
    }
    created += 1;
  }
  return {
    created,
    updated,
    skipped,
    total: rows.length,
  };
}

export async function listCotacoesCompra(): Promise<CotacaoCompraItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cotacoes_compra")
    .select("id, obra_id, material_id, titulo, status, created_at, obras(nome), materiais(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Erro ao listar cotações: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    obra_id: String(item.obra_id ?? ""),
    obra_nome: ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    material_id: item.material_id ? String(item.material_id) : null,
    material_nome: ((item.materiais as { nome?: string } | null)?.nome ?? "Material livre") as string,
    titulo: String(item.titulo ?? ""),
    status: String(item.status ?? "aberta"),
    created_at: String(item.created_at ?? ""),
  }));
}

export async function createCotacaoCompra(input: {
  obraId: string;
  materialId: string | null;
  titulo: string;
}) {
  const [empresaId, user] = await Promise.all([getEmpresaIdFromProfile(), getCurrentUser()]);
  const supabase = await createServerClient();
  const { error } = await supabase.from("cotacoes_compra").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    material_id: input.materialId,
    titulo: input.titulo,
    created_by: user?.id ?? null,
  });

  if (error) {
    throw new Error(`Erro ao criar cotação: ${error.message}`);
  }
}

export async function listCotacoesFornecedores(): Promise<CotacaoFornecedorItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cotacoes_fornecedores")
    .select("id, cotacao_id, fornecedor, valor_unitario, quantidade, prazo_dias, selecionado, aprovado")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    throw new Error(`Erro ao listar fornecedores das cotações: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    cotacao_id: String(item.cotacao_id ?? ""),
    fornecedor: String(item.fornecedor ?? ""),
    valor_unitario: Number(item.valor_unitario ?? 0),
    quantidade: Number(item.quantidade ?? 0),
    prazo_dias: Number(item.prazo_dias ?? 0),
    selecionado: Boolean(item.selecionado),
    aprovado: Boolean(item.aprovado),
  }));
}

export async function createCotacaoFornecedor(input: {
  cotacaoId: string;
  fornecedor: string;
  valorUnitario: number;
  quantidade: number;
  prazoDias: number;
  condicoes: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("cotacoes_fornecedores").insert({
    empresa_id: empresaId,
    cotacao_id: input.cotacaoId,
    fornecedor: input.fornecedor,
    valor_unitario: input.valorUnitario,
    quantidade: input.quantidade,
    prazo_dias: input.prazoDias,
    condicoes: input.condicoes,
  });

  if (error) {
    throw new Error(`Erro ao adicionar fornecedor na cotação: ${error.message}`);
  }
}

export async function listCotacaoRodadas(): Promise<CotacaoRodadaItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cotacoes_rodadas")
    .select("id, cotacao_id, numero, objetivo, observacoes, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    throw new Error(`Erro ao listar rodadas de cotação: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    cotacao_id: String(item.cotacao_id ?? ""),
    numero: Number(item.numero ?? 1),
    objetivo: String(item.objetivo ?? ""),
    observacoes: String(item.observacoes ?? ""),
    created_at: String(item.created_at ?? ""),
  }));
}

export async function createCotacaoRodada(input: {
  cotacaoId: string;
  objetivo: string;
  observacoes: string;
}) {
  const [empresaId, user, supabase] = await Promise.all([
    getEmpresaIdFromProfile(),
    getCurrentUser(),
    createServerClient(),
  ]);
  const maxRound = await supabase
    .from("cotacoes_rodadas")
    .select("numero")
    .eq("empresa_id", empresaId)
    .eq("cotacao_id", input.cotacaoId)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxRound.error) {
    throw new Error(`Erro ao buscar rodada atual: ${maxRound.error.message}`);
  }
  const numero = Number(maxRound.data?.numero ?? 0) + 1;

  const { error } = await supabase.from("cotacoes_rodadas").insert({
    empresa_id: empresaId,
    cotacao_id: input.cotacaoId,
    numero,
    objetivo: input.objetivo,
    observacoes: input.observacoes,
    created_by: user?.id ?? null,
  });

  if (error) {
    throw new Error(`Erro ao criar rodada de cotação: ${error.message}`);
  }

  const update = await supabase
    .from("cotacoes_compra")
    .update({ status: "negociacao" })
    .eq("empresa_id", empresaId)
    .eq("id", input.cotacaoId);

  if (update.error) {
    throw new Error(`Erro ao atualizar status da cotação: ${update.error.message}`);
  }
}

export async function adjudicarCotacao(input: {
  cotacaoId: string;
  fornecedorId: string;
  statusContrato: string;
  condicoes: string;
}) {
  const [empresaId, user, supabase] = await Promise.all([
    getEmpresaIdFromProfile(),
    getCurrentUser(),
    createServerClient(),
  ]);

  const selectedSupplier = await supabase
    .from("cotacoes_fornecedores")
    .select("id, cotacao_id, valor_unitario, quantidade, prazo_dias")
    .eq("empresa_id", empresaId)
    .eq("id", input.fornecedorId)
    .eq("cotacao_id", input.cotacaoId)
    .maybeSingle();

  if (selectedSupplier.error || !selectedSupplier.data) {
    throw new Error(`Erro ao validar fornecedor adjudicado: ${selectedSupplier.error?.message ?? "fornecedor não encontrado"}`);
  }

  const clearSelection = await supabase
    .from("cotacoes_fornecedores")
    .update({ selecionado: false, aprovado: false })
    .eq("empresa_id", empresaId)
    .eq("cotacao_id", input.cotacaoId);
  if (clearSelection.error) {
    throw new Error(`Erro ao limpar seleção de fornecedores: ${clearSelection.error.message}`);
  }

  const markWinner = await supabase
    .from("cotacoes_fornecedores")
    .update({ selecionado: true, aprovado: true })
    .eq("empresa_id", empresaId)
    .eq("id", input.fornecedorId);
  if (markWinner.error) {
    throw new Error(`Erro ao marcar fornecedor vencedor: ${markWinner.error.message}`);
  }

  const cotacao = await supabase
    .from("cotacoes_compra")
    .select("id, obra_id")
    .eq("empresa_id", empresaId)
    .eq("id", input.cotacaoId)
    .maybeSingle();
  if (cotacao.error || !cotacao.data?.obra_id) {
    throw new Error(`Erro ao carregar cotação para contrato: ${cotacao.error?.message ?? "cotação não encontrada"}`);
  }

  const valorTotal = Number(selectedSupplier.data.valor_unitario ?? 0) * Number(selectedSupplier.data.quantidade ?? 0);
  const contractInsert = await supabase.from("contratos_fornecedores").insert({
    empresa_id: empresaId,
    obra_id: cotacao.data.obra_id,
    cotacao_id: input.cotacaoId,
    fornecedor_id: input.fornecedorId,
    status: input.statusContrato,
    valor_total: valorTotal,
    prazo_dias: Number(selectedSupplier.data.prazo_dias ?? 0),
    condicoes: input.condicoes,
    created_by: user?.id ?? null,
    assinado_em: input.statusContrato === "assinado" ? new Date().toISOString() : null,
  });

  if (contractInsert.error) {
    throw new Error(`Erro ao criar contrato do fornecedor: ${contractInsert.error.message}`);
  }

  const quoteUpdate = await supabase
    .from("cotacoes_compra")
    .update({ status: "contratada" })
    .eq("empresa_id", empresaId)
    .eq("id", input.cotacaoId);
  if (quoteUpdate.error) {
    throw new Error(`Erro ao finalizar cotação: ${quoteUpdate.error.message}`);
  }
}

export async function listContratosFornecedores(): Promise<ContratoFornecedorItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("contratos_fornecedores")
    .select("id, obra_id, cotacao_id, fornecedor_id, status, valor_total, prazo_dias, condicoes, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(`Erro ao listar contratos de fornecedor: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    cotacao_id: String(row.cotacao_id ?? ""),
    fornecedor_id: row.fornecedor_id ? String(row.fornecedor_id) : null,
    status: String(row.status ?? "rascunho"),
    valor_total: Number(row.valor_total ?? 0),
    prazo_dias: Number(row.prazo_dias ?? 0),
    condicoes: String(row.condicoes ?? ""),
    created_at: String(row.created_at ?? ""),
  }));
}
