import test from "node:test";
import assert from "node:assert/strict";
import { ProjectService, ProjectServiceDeps } from "@/lib/domains/projects/service";
import { IProjectRepository } from "@/lib/domains/projects/repository";

class MockProjectRepository implements IProjectRepository {
  async listDocumentos(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "1",
        obraId: "ob1",
        obraNome: "Obra Teste",
        disciplina: "Arq",
        revisao: "A",
        status: "ok",
        observacoes: "test",
        createdAt: "now",
      }];
    }
    return [];
  }
  async createDocumento(empresaId: string, userId: string | null, input: any) {
    return Promise.resolve();
  }
  async listConflitos(empresaId: string) {
    return [];
  }
  async createConflito(empresaId: string, input: any) {
    return Promise.resolve();
  }
}

test("ProjectService.listDocumentos returns documents when company is valid", async () => {
  const deps: ProjectServiceDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentProfile: async () => ({ id: "user-123" }),
  };

  const repo = new MockProjectRepository();
  const service = new ProjectService(repo, deps);
  const result = await service.listDocumentos();

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].obraNome, "Obra Teste");
});

test("ProjectService.listDocumentos returns empty array on error", async () => {
  const deps: ProjectServiceDeps = {
    getEmpresaId: async () => {
      throw new Error("Auth failure");
    },
    getCurrentProfile: async () => ({ id: "user-123" }),
  };

  const repo = new MockProjectRepository();
  const service = new ProjectService(repo, deps);
  const result = await service.listDocumentos();

  assert.deepStrictEqual(result, []);
});
