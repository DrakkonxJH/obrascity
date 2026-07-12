import test from "node:test";
import assert from "node:assert/strict";
import { MateriaisService, MateriaisServiceDeps } from "@/lib/domains/materiais/service";
import { IMateriaisRepository } from "@/lib/domains/materiais/repository";

class MockMateriaisRepository implements IMateriaisRepository {
  async listMateriais(empresaId: string) {
    return [{ id: "mat1", nome: "Cimento", unidade: "Saco", quantidade: 100, minimo: 20 }];
  }
  async listPedidosCompra(empresaId: string) {
    return [{ id: "po1", obra_id: "ob1", status: "aberto", valor: 1000, quantidade: 10, fornecedor: "Fornec A", materiais: { nome: "Cimento" }, obras: { nome: "Obra A" } }];
  }
  async createMaterial(empresaId: string, input: any) { return Promise.resolve(); }
  async updateMaterial(empresaId: string, id: string, input: any) { return Promise.resolve(); }
  async getMateriais(empresaId: string) { return [{ id: "mat1", nome: "Cimento", unidade: "Saco" }]; }
  async upsertMaterial(empresaId: string, id?: string, input: any) { return Promise.resolve(); }
  async createPurchaseOrder(empresaId: string, input: any) { return { id: "po-new" }; }
  async getMaterialsForImport(empresaId: string) { return [{ id: "mat1", nome: "Cimento", unidade: "Saco" }]; }
  async getObrasForImport(empresaId: string) { return [{ id: "ob1", nome: "Obra A" }]; }
  async getExistingOrdersForImport(empresaId: string) { return []; }
  async upsertPurchaseOrder(empresaId: string, id?: string, input: any) { return Promise.resolve(); }
  async listCotacoesCompra(empresaId: string) { return []; }
  async createCotacaoCompra(empresaId: string, input: any) { return Promise.resolve(); }
  async listCotacoesFornecedores(empresaId: string) { return []; }
  async createCotacaoFornecedor(empresaId: string, input: any) { return Promise.resolve(); }
  async listCotacaoRodadas(empresaId: string) { return []; }
  async getLatestRodada(empresaId: string, cotacaoId: string) { return null; }
  async createCotacaoRodada(empresaId: string, input: any) { return Promise.resolve(); }
  async updateCotacaoStatus(empresaId: string, cotacaoId: string, status: string) { return Promise.resolve(); }
  async getCotacaoFornecedor(empresaId: string, cotacaoId: string, fornecedorId: string) { return null; }
  async clearCotacaoFornecedorSelection(empresaId: string, cotacaoId: string) { return Promise.resolve(); }
  async markFornecedorAsWinner(empresaId: string, fornecedorId: string) { return Promise.resolve(); }
  async getCotacaoObra(empresaId: string, cotacaoId: string) { return { obra_id: "ob1" }; }
  async createContrato(empresaId: string, input: any) { return Promise.resolve(); }
  async listContratos(empresaId: string) { return []; }
}

test("MateriaisService.listMateriais returns mapped data", async () => {
  const deps: MateriaisServiceDeps = { getEmpresaId: async () => "emp-123" };
  const repo = new MockMateriaisRepository();
  const service = new MateriaisService(repo, deps);

  const result = await service.listMateriais();
  assert.strictEqual(result[0].nome, "Cimento");
  assert.strictEqual(result[0].minimo, 20);
});

test("MateriaisService.listPedidosCompra filters by active obras", async () => {
  const deps: MateriaisServiceDeps = { getEmpresaId: async () => "emp-123" };
  const repo = new MockMateriaisRepository();
  const service = new MateriaisService(repo, deps);

  const activeObraIds = new Set(["ob1"]);
  const result = await service.listPedidosCompra(activeObraIds);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].obraId, "ob1");
});
