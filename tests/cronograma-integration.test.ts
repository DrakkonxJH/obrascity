import test from "node:test";
import assert from "node:assert/strict";
import { CronogramaService, CronogramaServiceDeps } from "@/lib/domains/cronograma/service";
import { ICronogramaRepository } from "@/lib/domains/cronograma/repository";

class MockCronogramaRepository implements ICronogramaRepository {
  async listTarefas(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "t1",
        obra_id: "ob1",
        nome: "Tarefa 1",
        inicio: "2026-01-01",
        fim: "2026-01-10",
        status: "planejado",
        updated_at: "now",
        obras: { nome: "Obra Teste" }
      }];
    }
    return [];
  }
  async createTarefa(empresaId: string, input: any) {
    return { id: "t-new" };
  }
  async updateTarefa(empresaId: string, input: any) {
    return { id: input.id, obra_id: "ob1" };
  }
  async deleteTarefa(empresaId: string, id: string) {
    return Promise.resolve();
  }
  async listDependencias(empresaId: string) {
    return [{ id: "d1", tarefa_predecessora_id: "t1", tarefa_sucessora_id: "t2", tipo: "fs" }];
  }
  async createDependencia(empresaId: string, input: any) {
    return Promise.resolve();
  }
  async getLatestBaselines(empresaId: string) {
    return [{ tarefa_id: "t1", obra_id: "ob1", versao: 1 }];
  }
  async snapshotBaseline(empresaId: string, obraId: string, tarefas: any[], nextVersao: number) {
    return Promise.resolve();
  }
  async listReplanejamentos(empresaId: string) {
    return [{ id: "r1", obra_id: "ob1", motivo: "teste", impacto_prazo_dias: 5, impacto_custo: 100, status: "pendente", created_at: "now", obras: { nome: "Obra Teste" } }];
  }
  async createReplanejamento(empresaId: string, input: any) {
    return { id: "r-new" };
  }
}

test("CronogramaService.listCronograma maps data correctly", async () => {
  const deps: CronogramaServiceDeps = {
    getEmpresaId: async () => "emp-123",
    listObras: async () => [{ id: "ob1", nome: "Obra Teste" }],
    ensureObraAtiva: async () => {},
  };
  const repo = new MockCronogramaRepository();
  const service = new CronogramaService(repo, deps);

  const result = await service.listCronograma();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].nome, "Tarefa 1");
  assert.strictEqual(result[0].obraNome, "Obra Teste");
});

test("CronogramaService.createTarefa returns new id", async () => {
  const deps: CronogramaServiceDeps = {
    getEmpresaId: async () => "emp-123",
    listObras: async () => [],
    ensureObraAtiva: async () => {},
  };
  const repo = new MockCronogramaRepository();
  const service = new CronogramaService(repo, deps);

  const result = await service.createTarefa({
    obraId: "ob1",
    nome: "New Task",
    inicio: "2026-01-01",
    fim: "2026-01-10",
  });
  assert.strictEqual(result, "t-new");
});
