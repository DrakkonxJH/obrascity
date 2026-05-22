import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
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
  const { error } = await supabase.from("pedidos_compra").insert({
    empresa_id: empresaId,
    material_id: input.material_id,
    obra_id: input.obra_id,
    fornecedor: input.fornecedor,
    quantidade: input.quantidade,
    valor: input.valor,
    status: input.status,
  });
  if (error) {
    throw new Error(`Erro ao criar pedido de compra: ${error.message}`);
  }
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
