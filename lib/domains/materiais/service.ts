import { IMateriaisRepository } from "./repository";
import {
  MaterialItem,
  PedidoCompraItem,
  MaterialImportResult,
  PurchaseOrderImportResult,
  CotacaoCompraItem,
  CotacaoFornecedorItem,
  CotacaoRodadaItem,
  ContratoFornecedorItem,
  CreateCotacaoCompraInput,
  CreateCotacaoFornecedorInput,
  CreateCotacaoRodadaInput,
  AdjudicarCotacaoInput
} from "./entities";
import { logDomainError, logInfraError } from "@/lib/observability/logger";
import { ensureObraAtiva } from "@/lib/db/obras";
import { getCurrentUser } from "@/lib/auth/session";

export type MateriaisServiceDeps = {
  getEmpresaId: () => Promise<string>;
};

export class MateriaisService {
  constructor(
    private repository: IMateriaisRepository,
    private deps: MateriaisServiceDeps
  ) {}

  async listMateriais(): Promise<MaterialItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listMateriais(empresaId);
      return rows.map((item) => ({
        id: item.id as string,
        nome: item.nome as string,
        unidade: item.unidade as string,
        quantidade: Number(item.quantidade ?? 0),
        minimo: Number(item.minimo ?? 0),
        mínimo: Number(item.minimo ?? 0),
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listMateriais" });
      return [];
    }
  }

  async listPedidosCompra(activeObraIds: Set<string>): Promise<PedidoCompraItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listPedidosCompra(empresaId);
      return rows
        .filter((item) => activeObraIds.has(item.obra_id as string))
        .map((item) => {
          const obraId = item.obra_id as string;
          const materialNome = item.materiais?.nome ?? "Material";
          const obraNome = item.obras?.nome ?? "Obra";

          return {
            id: item.id as string,
            obraId,
            obra_id: obraId,
            materialNome,
            material_nome: materialNome,
            obraNome,
            obra_nome: obraNome,
            fornecedor: item.fornecedor ?? "",
            quantidade: Number(item.quantidade ?? 0),
            status: item.status as string,
            valor: Number(item.valor ?? 0),
          };
        });
    } catch (error: any) {
      logInfraError(error, { action: "listPedidosCompra" });
      return [];
    }
  }

  async createMaterial(input: any): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.createMaterial(empresaId, input);
    } catch (error: any) {
      logDomainError(error, { action: "createMaterial", input });
      throw error;
    }
  }

  async updateMaterial(id: string, input: any): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.updateMaterial(empresaId, id, input);
    } catch (error: any) {
      logDomainError(error, { action: "updateMaterial", id, input });
      throw error;
    }
  }

  async importMaterials(rows: any[]): Promise<MaterialImportResult> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const existing = await this.repository.getMateriais(empresaId);

      const materialKey = (nome: string, unidade: string) =>
        `${nome.trim().toLowerCase()}|${unidade.trim().toLowerCase()}`;

      const existingByKey = new Map(
        existing.map((item) => [materialKey(item.nome as string, item.unidade as string), item.id as string]),
      );

      const dedupedRows = new Map<string, any>();
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
          await this.repository.upsertMaterial(empresaId, existingId, row);
          updated++;
        } else {
          await this.repository.upsertMaterial(empresaId, undefined, row);
          created++;
        }
      }

      return {
        created,
        updated,
        skipped: rows.length - dedupedRows.size,
        total: rows.length,
      };
    } catch (error: any) {
      logDomainError(error, { action: "importMaterials" });
      throw error;
    }
  }

  async createPurchaseOrder(input: any): Promise<string> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await ensureObraAtiva(input.obra_id);
      const result = await this.repository.createPurchaseOrder(empresaId, input);
      return result.id;
    } catch (error: any) {
      logDomainError(error, { action: "createPurchaseOrder", input });
      throw error;
    }
  }

  async importPurchaseOrders(rows: any[]): Promise<PurchaseOrderImportResult> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const [materials, obras, existingOrders] = await Promise.all([
        this.repository.getMaterialsForImport(empresaId),
        this.repository.getObrasForImport(empresaId),
        this.repository.getExistingOrdersForImport(empresaId),
      ]);

      const normalize = (v: string) => v.trim().toLowerCase();
      const orderKey = (mId: string, oId: string) => `${mId}|${oId}`;

      const materialsByName = new Map(materials.map(m => [normalize(m.nome as string), m.id as string]));
      const obrasByName = new Map(obras.map(o => [normalize(o.nome as string), o.id as string]));
      const existingByKey = new Map(existingOrders.map(o => [orderKey(o.material_id as string, o.obra_id as string), o.id as string]));

      const dedupedRows = new Map<string, any>();
      for (const row of rows) {
        const key = `${normalize(row.material)}|${normalize(row.obra)}`;
        dedupedRows.set(key, row);
      }

      let created = 0;
      let updated = 0;
      let skipped = rows.length - dedupedRows.size;

      for (const row of dedupedRows.values()) {
        const mId = materialsByName.get(normalize(row.material));
        const oId = obrasByName.get(normalize(row.obra));
        if (!mId || !oId) {
          skipped++;
          continue;
        }
        const existingId = existingByKey.get(orderKey(mId, oId));
        const payload = {
          material_id: mId,
          obra_id: oId,
          fornecedor: row.fornecedor,
          quantidade: row.quantidade,
          valor: row.valor,
          status: row.status,
        };
        if (existingId) {
          await this.repository.upsertPurchaseOrder(empresaId, existingId, payload);
          updated++;
        } else {
          await this.repository.upsertPurchaseOrder(empresaId, undefined, payload);
          created++;
        }
      }

      return { created, updated, skipped, total: rows.length };
    } catch (error: any) {
      logDomainError(error, { action: "importPurchaseOrders" });
      throw error;
    }
  }

  async listCotacoesCompra(): Promise<CotacaoCompraItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listCotacoesCompra(empresaId);
      return rows.map(item => {
        const obraId = String(item.obra_id ?? "");
        const obraNome = ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string;
        const materialId = item.material_id ? String(item.material_id) : null;
        const materialNome = ((item.materiais as { nome?: string } | null)?.nome ?? "Material livre") as string;
        const createdAt = String(item.created_at ?? "");

        return {
          id: String(item.id ?? ""),
          obraId,
          obra_id: obraId,
          obraNome,
          obra_nome: obraNome,
          materialId,
          material_id: materialId,
          materialNome,
          material_nome: materialNome,
          titulo: String(item.titulo ?? ""),
          status: String(item.status ?? "aberta"),
          createdAt,
          created_at: createdAt,
        };
      });
    } catch (error: any) {
      logInfraError(error, { action: "listCotacoesCompra" });
      return [];
    }
  }

  async createCotacaoCompra(input: CreateCotacaoCompraInput): Promise<void> {
    try {
      const [empresaId, user] = await Promise.all([this.deps.getEmpresaId(), getCurrentUser()]);
      await this.repository.createCotacaoCompra(empresaId, {
        ...input,
        created_by: user?.id ?? null,
      });
    } catch (error: any) {
      logDomainError(error, { action: "createCotacaoCompra", input });
      throw error;
    }
  }

  async listCotacoesFornecedores(): Promise<CotacaoFornecedorItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listCotacoesFornecedores(empresaId);
      return rows.map(item => {
        const cotacaoId = String(item.cotacao_id ?? "");
        const valorUnitario = Number(item.valor_unitario ?? 0);
        const prazoDias = Number(item.prazo_dias ?? 0);

        return {
          id: String(item.id ?? ""),
          cotacaoId,
          cotacao_id: cotacaoId,
          fornecedor: String(item.fornecedor ?? ""),
          valorUnitario,
          valor_unitario: valorUnitario,
          quantidade: Number(item.quantidade ?? 0),
          prazoDias,
          prazo_dias: prazoDias,
          selecionado: Boolean(item.selecionado),
          aprovado: Boolean(item.aprovado),
        };
      });
    } catch (error: any) {
      logInfraError(error, { action: "listCotacoesFornecedores" });
      return [];
    }
  }

  async createCotacaoFornecedor(input: CreateCotacaoFornecedorInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.createCotacaoFornecedor(empresaId, {
        ...input,
        valor_unitario: input.valorUnitario,
        prazo_dias: input.prazoDias,
      });
    } catch (error: any) {
      logDomainError(error, { action: "createCotacaoFornecedor", input });
      throw error;
    }
  }

  async listCotacaoRodadas(): Promise<CotacaoRodadaItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listCotacaoRodadas(empresaId);
      return rows.map(item => ({
        id: String(item.id ?? ""),
        cotacaoId: String(item.cotacao_id ?? ""),
        numero: Number(item.numero ?? 1),
        objetivo: String(item.objetivo ?? ""),
        observacoes: String(item.observacoes ?? ""),
        createdAt: String(item.created_at ?? ""),
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listCotacaoRodadas" });
      return [];
    }
  }

  async createCotacaoRodada(input: CreateCotacaoRodadaInput): Promise<void> {
    try {
      const [empresaId, user] = await Promise.all([this.deps.getEmpresaId(), getCurrentUser()]);
      const latest = await this.repository.getLatestRodada(empresaId, input.cotacaoId);
      const numero = Number(latest?.numero ?? 0) + 1;

      await this.repository.createCotacaoRodada(empresaId, {
        ...input,
        numero,
        created_by: user?.id ?? null,
      });

      await this.repository.updateCotacaoStatus(empresaId, input.cotacaoId, "negociacao");
    } catch (error: any) {
      logDomainError(error, { action: "createCotacaoRodada", input });
      throw error;
    }
  }

  async adjudicarCotacao(input: AdjudicarCotacaoInput): Promise<void> {
    try {
      const [empresaId, user] = await Promise.all([this.deps.getEmpresaId(), getCurrentUser()]);

      const selected = await this.repository.getCotacaoFornecedor(empresaId, input.cotacaoId, input.fornecedorId);
      if (!selected) throw new Error("Fornecedor não encontrado");

      await this.repository.clearCotacaoFornecedorSelection(empresaId, input.cotacaoId);
      await this.repository.markFornecedorAsWinner(empresaId, input.fornecedorId);

      const cotacao = await this.repository.getCotacaoObra(empresaId, input.cotacaoId);
      if (!cotacao?.obra_id) throw new Error("Cotação sem obra vinculada");

      const valorTotal = Number(selected.valor_unitario ?? 0) * Number(selected.quantidade ?? 0);
      await this.repository.createContrato(empresaId, {
        obra_id: cotacao.obra_id,
        cotacao_id: input.cotacaoId,
        fornecedor_id: input.fornecedorId,
        status: input.statusContrato,
        valor_total: valorTotal,
        prazo_dias: Number(selected.prazo_dias ?? 0),
        condicoes: input.condicoes,
        created_by: user?.id ?? null,
        assinado_em: input.statusContrato === "assinado" ? new Date().toISOString() : null,
      });

      await this.repository.updateCotacaoStatus(empresaId, input.cotacaoId, "contratada");
    } catch (error: any) {
      logDomainError(error, { action: "adjudicarCotacao", input });
      throw error;
    }
  }

  async listContratos(): Promise<ContratoFornecedorItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listContratos(empresaId);
      return rows.map(row => {
        const obraId = String(row.obra_id ?? "");
        const obraNome = ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string;
        const cotacaoId = String(row.cotacao_id ?? "");
        const fornecedorId = row.fornecedor_id ? String(row.fornecedor_id) : null;
        const valorTotal = Number(row.valor_total ?? 0);
        const prazoDias = Number(row.prazo_dias ?? 0);
        const createdAt = String(row.created_at ?? "");

        return {
          id: String(row.id ?? ""),
          obraId,
          obra_id: obraId,
          obraNome,
          obra_nome: obraNome,
          cotacaoId,
          cotacao_id: cotacaoId,
          fornecedorId,
          fornecedor_id: fornecedorId,
          status: String(row.status ?? "rascunho"),
          valorTotal,
          valor_total: valorTotal,
          prazoDias,
          prazo_dias: prazoDias,
          condicoes: String(row.condicoes ?? ""),
          createdAt,
          created_at: createdAt,
        };
      });
    } catch (error: any) {
      logInfraError(error, { action: "listContratos" });
      return [];
    }
  }
}
