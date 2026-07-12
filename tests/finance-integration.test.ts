import test from "node:test";
import assert from "node:assert/strict";
import { FinanceService, FinanceServiceDeps } from "@/lib/domains/finance/service";
import { IFinanceRepository } from "@/lib/domains/finance/repository";

class MockFinanceRepository implements IFinanceRepository {
  async list(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "f1",
        obra_id: "ob1",
        categoria: "Material",
        orcado: 1000,
        realizado: 800,
        obras: { nome: "Obra Teste" }
      }];
    }
    return [];
  }
  async create(empresaId: string, input: any) {
    return Promise.resolve();
  }
  async update(empresaId: string, input: any) {
    return input.id === "f1";
  }
}

test("FinanceService.listFinanceiro maps data correctly", async () => {
  const deps: FinanceServiceDeps = {
    getEmpresaId: async () => "emp-123",
    listActiveObraIds: async () => new Set(["ob1"]),
  };
  const repo = new MockFinanceRepository();
  const service = new FinanceService(repo, deps);

  const result = await service.listFinanceiro();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "f1");
  assert.strictEqual(result[0].obraNome, "Obra Teste");
});
