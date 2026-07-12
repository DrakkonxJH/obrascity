import test from "node:test";
import assert from "node:assert/strict";
import { DiarioService, DiarioDeps } from "@/lib/domains/diario/service";
import { IDiarioRepository } from "@/lib/domains/diario/repository";

class MockDiarioRepository implements IDiarioRepository {
  async listDiarios(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "d1",
        obra_id: "ob1",
        data_ref: "2026-01-01",
        clima: "Sol",
        efetivo: 10,
        equipamentos: "encrypt-eq",
        ocorrencias: "encrypt-oc",
        observacoes_ssma: "encrypt-obs",
        assinatura_url: "url-sig",
        created_by: "u1",
        obras: { nome: "Obra Teste" }
      }];
    }
    return [];
  }
  async upsertDiario(empresaId: string, payload: any) {
    return { id: "d-new" };
  }
  async listProfiles(empresaId: string, ids: string[]) {
    return ids.map(id => ({ id, nome: `User ${id}` }));
  }
  async listEvidencias(empresaId: string, diarioIds: string[]) {
    return diarioIds.map(id => ({
      id: `e-${id}`,
      diario_id: id,
      arquivo_url: `url-${id}`,
      descricao: `desc-${id}`,
      mime_type: "image/jpeg",
      size_bytes: 1024,
      created_at: "now"
    }));
  }
  async insertEvidencias(empresaId: string, rows: any[]) {
    return Promise.resolve();
  }
}

test("DiarioService.listDiarios maps data correctly", async () => {
  const deps: DiarioDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentUser: async () => ({ id: "u1" }),
    ensureObraAtiva: async () => {},
    listActiveObraIds: async () => new Set(["ob1"]),
    decryptField: (f) => f?.replace("encrypt-", "decrypted-"),
    encryptField: (f) => f ? `encrypt-${f}` : null,
    validateUploadCollection: () => {},
    createAdminClient: () => {
      return {
        storage: {
          from: () => {
            return {
              upload: async () => ({ data: {}, error: null }),
              createSignedUrl: async () => ({ data: { signedUrl: "signed-url" }, error: null })
            };
          }
        }
      };
    },

  };
  const repo = new MockDiarioRepository();
  const service = new DiarioService(repo, deps);

  const result = await service.listDiarios();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "d1");
  assert.strictEqual(result[0].obraNome, "Obra Teste");
  assert.strictEqual(result[0].equipamentos, "decrypted-eq");
  assert.strictEqual(result[0].createdByNome, "User u1");
  assert.strictEqual(result[0].evidencias.length, 1);
  assert.strictEqual(result[0].evidencias[0].arquivoUrl, "url-d1");
});

test("DiarioService.createDiario returns new id", async () => {
  const deps: DiarioDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentUser: async () => ({ id: "u1" }),
    ensureObraAtiva: async () => {},
    listActiveObraIds: async () => new Set([]),
    decryptField: (f) => f,
    encryptField: (f) => f,
    validateUploadCollection: () => {},
    createAdminClient: () => ({}) as any,
  };
  const repo = new MockDiarioRepository();
  const service = new DiarioService(repo, deps);

  const result = await service.createDiario({
    obraId: "ob1",
    dataRef: "2026-01-01",
    efetivo: 5,
  });
  assert.strictEqual(result, "d-new");
});

test("DiarioService.uploadDiarioEvidencias coordinates upload", async () => {
  const mockAdmin = {
    storage: {
      from: () => ({
        upload: async () => ({ data: {}, error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: "signed-url" }, error: null })
      })
    }
  };
  const deps: DiarioDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentUser: async () => ({ id: "u1" }),
    ensureObraAtiva: async () => {},
    listActiveObraIds: async () => new Set([]),
    decryptField: (f) => f,
    encryptField: (f) => f,
    validateUploadCollection: () => {},
    createAdminClient: () => mockAdmin,
  };

  const repo = new MockDiarioRepository();
  const service = new DiarioService(repo, deps);

  const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
  await service.uploadDiarioEvidencias({
    diarioId: "d1",
    obraId: "ob1",
    files: [file],
    descricao: "test desc",
  });
  // If it doesn't throw, it's a success for this mock
});
