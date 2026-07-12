import test from "node:test";
import assert from "node:assert/strict";
import { ObrasService, ObrasServiceDeps } from "@/lib/domains/obras/service";
import { IObrasRepository } from "@/lib/domains/obras/repository";

class MockObrasRepository implements IObrasRepository {
  async supportsTrash(empresaId: string) {
    return empresaId === "emp-123";
  }
  async listActive(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{ id: "ob1", nome: "Obra 1", status: "andamento" }];
    }
    return [];
  }
  async listTrash(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{ id: "ob-trash", nome: "Obra Trash", status: "lixeira" }];
    }
    return [];
  }
  async findOneActive(empresaId: string, obraId: string) {
    if (empresaId === "emp-123" && obraId === "ob1") {
      return { id: "ob1", nome: "Obra 1", status: "andamento" };
    }
    return null;
  }
  async softDelete(empresaId: string, obraId: string, deletedBy: string) {
    return obraId === "ob1";
  }
  async restore(empresaId: string, obraId: string) {
    return obraId === "ob-trash";
  }
  async create(empresaId: string, input: any, trashEnabled: boolean) {
    return Promise.resolve();
  }
  async update(empresaId: string, obraId: string, input: any, trashEnabled: boolean) {
    return obraId === "ob1";
  }
}

test("ObrasService.listObras returns active obras", async () => {
  const deps: ObrasServiceDeps = {
    getEmpresaId: async () => "emp-123",
  };
  const repo = new MockObrasRepository();
  const service = new ObrasService(repo, deps);

  const result = await service.listObras();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].nome, "Obra 1");
});

test("ObrasService.ensureObraAtiva throws for missing obra", async () => {
  const deps: ObrasServiceDeps = {
    getEmpresaId: async () => "emp-123",
  };
  const repo = new MockObrasRepository();
  const service = new ObrasService(repo, deps);

  await assert.rejects(
    service.ensureObraAtiva("ob-missing"),
    { message: /Obra não encontrada/ }
  );
});

test("ObrasService.getDashboardResumo aggregates status", async () => {
  const deps: ObrasServiceDeps = {
    getEmpresaId: async () => "emp-123",
  };
  const repo = new MockObrasRepository();
  const service = new ObrasService(repo, deps);

  const result = await service.getDashboardResumo();
  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.andamento, 1);
  assert.strictEqual(result.concluidas, 0);
});
