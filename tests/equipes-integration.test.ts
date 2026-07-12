import test from "node:test";
import assert from "node:assert/strict";
import { EquipesService, EquipesServiceDeps } from "@/lib/domains/equipes/service";
import { IEquipesRepository } from "@/lib/domains/equipes/repository";

class MockEquipesRepository implements IEquipesRepository {
  async listEquipes(empresaId: string) {
    return [{ id: "e1", nome: "Equipe A", especialidade: "Civil" }];
  }
  async listMembros(empresaId: string) {
    return [{ id: "m1", profile_id: "p1", equipe_id: "e1", cargo: "Engenheiro", crea: "123", profiles: { nome: "João", email: "joao@example.com" } }];
  }
  async createEquipe(empresaId: string, input: any) {
    return Promise.resolve();
  }
  async createMembro(empresaId: string, input: any) {
    return Promise.resolve();
  }
}

test("EquipesService.listEquipes returns list", async () => {
  const deps: EquipesServiceDeps = {
    getEmpresaId: async () => "emp-123",
  };
  const repo = new MockEquipesRepository();
  const service = new EquipesService(repo, deps);

  const result = await service.listEquipes();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].nome, "Equipe A");
});

test("EquipesService.listMembros maps profiles", async () => {
  const deps: EquipesServiceDeps = {
    getEmpresaId: async () => "emp-123",
  };
  const repo = new MockEquipesRepository();
  const service = new EquipesService(repo, deps);

  const result = await service.listMembros();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].nome, "João");
  assert.strictEqual(result[0].email, "joao@example.com");
});
