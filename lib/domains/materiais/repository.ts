import { SupabaseClient } from "@supabase/supabase-js";
import {
  MaterialItem,
  PedidoCompraItem,
  MaterialImportInput,
  PurchaseOrderImportInput,
  PurchaseOrderInput,
  CotacaoCompraItem,
  CotacaoFornecedorItem,
  CotacaoRodadaItem,
  ContratoFornecedorItem,
  CreateCotacaoCompraInput,
  CreateCotacaoFornecedorInput,
  CreateCotacaoRodadaInput
} from "./entities";

export interface IMateriaisRepository {
  listMateriais(empresaId: string): Promise<any[]>;
  listPedidosCompra(empresaId: string): Promise<any[]>;
  createMaterial(empresaId: string, input: any): Promise<void>;
  updateMaterial(empresaId: string, id: string, input: any): Promise<void>;
  getMateriais(empresaId: string): Promise<any[]>;
  upsertMaterial(empresaId: string, id: string | undefined, input: any): Promise<void>;
  createPurchaseOrder(empresaId: string, input: any): Promise<{ id: string }>;
  getMaterialsForImport(empresaId: string): Promise<any[]>;
  getObrasForImport(empresaId: string): Promise<any[]>;
  getExistingOrdersForImport(empresaId: string): Promise<any[]>;
  upsertPurchaseOrder(empresaId: string, id: string | undefined, input: any): Promise<void>;
  listCotacoesCompra(empresaId: string): Promise<any[]>;
  createCotacaoCompra(empresaId: string, input: any): Promise<void>;
  listCotacoesFornecedores(empresaId: string): Promise<any[]>;
  createCotacaoFornecedor(empresaId: string, input: any): Promise<void>;
  listCotacaoRodadas(empresaId: string): Promise<any[]>;
  getLatestRodada(empresaId: string, cotacaoId: string): Promise<any>;
  createCotacaoRodada(empresaId: string, input: any): Promise<void>;
  updateCotacaoStatus(empresaId: string, cotacaoId: string, status: string): Promise<void>;
  getCotacaoFornecedor(empresaId: string, cotacaoId: string, fornecedorId: string): Promise<any>;
  clearCotacaoFornecedorSelection(empresaId: string, cotacaoId: string): Promise<void>;
  markFornecedorAsWinner(empresaId: string, fornecedorId: string): Promise<void>;
  getCotacaoObra(empresaId: string, cotacaoId: string): Promise<any>;
  createContrato(empresaId: string, input: any): Promise<void>;
  listContratos(empresaId: string): Promise<any[]>;
}

export class SupabaseMateriaisRepository implements IMateriaisRepository {
  constructor(private supabase: SupabaseClient) {}

  async listMateriais(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("materiais")
      .select("id, nome, unidade, quantidade, minimo")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async listPedidosCompra(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("pedidos_compra")
      .select("id, obra_id, status, valor, quantidade, fornecedor, materiais(nome), obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createMaterial(empresaId: string, input: any): Promise<void> {
    const { error } = await this.supabase.from("materiais").insert({
      empresa_id: empresaId,
      ...input,
      minimo: input.mínimo,
    });
    if (error) throw error;
  }

  async updateMaterial(empresaId: string, id: string, input: any): Promise<void> {
    const { error } = await this.supabase
      .from("materiais")
      .update({
        ...input,
        minimo: input.mínimo,
      })
      .eq("id", id)
      .eq("empresa_id", empresaId);
    if (error) throw error;
  }

  async getMateriais(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("materiais")
      .select("id, nome, unidade")
      .eq("empresa_id", empresaId);
    if (error) throw error;
    return data ?? [];
  }

  async upsertMaterial(empresaId: string, id: string | undefined, input: any): Promise<void> {
    if (id) {
      await this.updateMaterial(empresaId, id, input);
    } else {
      await this.createMaterial(empresaId, input);
    }
  }

  async createPurchaseOrder(empresaId: string, input: any): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("pedidos_compra")
      .insert({
        empresa_id: empresaId,
        ...input,
      })
      .select("id")
      .single();
    if (error || !data?.id) throw new Error(error?.message ?? "Erro ao criar pedido");
    return data;
  }

  async getMaterialsForImport(empresaId: string): Promise<any[]> {
    return this.getMateriais(empresaId);
  }

  async getObrasForImport(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("obras")
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .is("deleted_at", null);
    if (error) throw error;
    return data ?? [];
  }

  async getExistingOrdersForImport(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("pedidos_compra")
      .select("id, material_id, obra_id")
      .eq("empresa_id", empresaId);
    if (error) throw error;
    return data ?? [];
  }

  async upsertPurchaseOrder(empresaId: string, id: string | undefined, input: any): Promise<void> {
    if (id) {
      const { error } = await this.supabase
        .from("pedidos_compra")
        .update(input)
        .eq("id", id)
        .eq("empresa_id", empresaId);
      if (error) throw error;
    } else {
      const { error } = await this.supabase.from("pedidos_compra").insert({
        empresa_id: empresaId,
        ...input,
      });
      if (error) throw error;
    }
  }

  async listCotacoesCompra(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("cotacoes_compra")
      .select("id, obra_id, material_id, titulo, status, created_at, obras(nome), materiais(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  }

  async createCotacaoCompra(empresaId: string, input: any): Promise<void> {
    const { error } = await this.supabase.from("cotacoes_compra").insert({
      empresa_id: empresaId,
      ...input,
    });
    if (error) throw error;
  }

  async listCotacoesFornecedores(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("cotacoes_fornecedores")
      .select("id, cotacao_id, fornecedor, valor_unitario, quantidade, prazo_dias, selecionado, aprovado")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(400);
    if (error) throw error;
    return data ?? [];
  }

  async createCotacaoFornecedor(empresaId: string, input: any): Promise<void> {
    const { error } = await this.supabase.from("cotacoes_fornecedores").insert({
      empresa_id: empresaId,
      ...input,
    });
    if (error) throw error;
  }

  async listCotacaoRodadas(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("cotacoes_rodadas")
      .select("id, cotacao_id, numero, objetivo, observacoes, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(400);
    if (error) throw error;
    return data ?? [];
  }

  async getLatestRodada(empresaId: string, cotacaoId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("cotacoes_rodadas")
      .select("numero")
      .eq("empresa_id", empresaId)
      .eq("cotacao_id", cotacaoId)
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createCotacaoRodada(empresaId: string, input: any): Promise<void> {
    const { error } = await this.supabase.from("cotacoes_rodadas").insert({
      empresa_id: empresaId,
      ...input,
    });
    if (error) throw error;
  }

  async updateCotacaoStatus(empresaId: string, cotacaoId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from("cotacoes_compra")
      .update({ status })
      .eq("empresa_id", empresaId)
      .eq("id", cotacaoId);
    if (error) throw error;
  }

  async getCotacaoFornecedor(empresaId: string, cotacaoId: string, fornecedorId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("cotacoes_fornecedores")
      .select("id, cotacao_id, valor_unitario, quantidade, prazo_dias")
      .eq("empresa_id", empresaId)
      .eq("id", fornecedorId)
      .eq("cotacao_id", cotacaoId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async clearCotacaoFornecedorSelection(empresaId: string, cotacaoId: string): Promise<void> {
    const { error } = await this.supabase
      .from("cotacoes_fornecedores")
      .update({ selecionado: false, aprovado: false })
      .eq("empresa_id", empresaId)
      .eq("cotacao_id", cotacaoId);
    if (error) throw error;
  }

  async markFornecedorAsWinner(empresaId: string, fornecedorId: string): Promise<void> {
    const { error } = await this.supabase
      .from("cotacoes_fornecedores")
      .update({ selecionado: true, aprovado: true })
      .eq("empresa_id", empresaId)
      .eq("id", fornecedorId);
    if (error) throw error;
  }

  async getCotacaoObra(empresaId: string, cotacaoId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("cotacoes_compra")
      .select("id, obra_id")
      .eq("empresa_id", empresaId)
      .eq("id", cotacaoId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createContrato(empresaId: string, input: any): Promise<void> {
    const { error } = await this.supabase.from("contratos_fornecedores").insert({
      empresa_id: empresaId,
      ...input,
    });
    if (error) throw error;
  }

  async listContratos(empresaId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("contratos_fornecedores")
      .select("id, obra_id, cotacao_id, fornecedor_id, status, valor_total, prazo_dias, condicoes, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data ?? [];
  }
}
