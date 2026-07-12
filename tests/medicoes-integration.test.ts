import test from "node:test";
import assert from "node:assert/strict";
import { MedicoesService, MedicoesServiceDeps } from "@/lib/domains/medicoes/service";
import { IMedicoesRepository } from "@/lib/domains/medicoes/repository";

class MockMedicoesRepository implements IMedicoesRepository {
  async listMedicoes(empresaId: string) {
    return [{ id: "med1", obra_id: "ob1", referencia: "Ref 1", valor: 1000, retencao: 50, aditivo: 100, status: "aprovado", obras: { nome: "Obra A" } }];
  }
  async createMedicao(empresaId: string, input: any) {
    return { id: "med-new" };
  }
  async getFinanceiroResumo(empresaId: string) {
    return [{ orcado: 10000, realizado: 5000 }];
  }
}

test("MedicoesService.listMedicoes filters by active obras", async () => {
  const deps: MedicoesServiceDeps = {
    getEmpresaId: async () => "emp-123",
    listObras: async () => [],
    ensureObraAtiva: async () => {},
  };
  const repo = new MockMedicoesRepository();
  const service = new MedicoesService(repo, deps);

  const activeObraIds = new Set(["ob1"]);
  const result = await service.listMedicoes(activeObraIds);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].obraId, "ob1");
  assert.strictEqual(result[0].valor, 1000);
});

test("MedicoesService.getEvmIndicadores calculates basic metrics", async () => {
  const deps: MedicoesServiceDeps = {
    getEmpresaId: async () => "emp-123",
    listObras: async () => [{ id: "ob1", progresso: 50 }],
    ensureObraAtiva: async () => {},
  };
  const repo = new MockMedicoesRepository();
  const service = new MedicoesService(repo, deps);

  const result = await service.getEvmIndicadores();
  assert.strictEqual(result.pv, 10000);
  assert.strictEqual(result.ac, 5000);
});
