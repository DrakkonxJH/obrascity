import test from "node:test";
import assert from "node:assert/strict";
import { EntregaService, EntregaDeps } from "@/lib/domains/entrega/service";
import { IEntregaRepository } from "@/lib/domains/entrega/repository";

class MockEntregaRepository implements IEntregaRepository {
  async listComissionamento(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "c1",
        obra_id: "ob1",
        sistema: "Elétrica",
        ambiente: "Térreo",
        item: "Quadro Geral",
        status: "concluido",
        observacao: "OK",
        created_at: "now",
        obras: { nome: "Obra Teste" }
      }];
    }
    return [];
  }
  async createComissionamento(empresaId: string, payload: any) {
    return Promise.resolve();
  }
  async listEntregas(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "e1",
        obra_id: "ob1",
        status: "preparacao",
        chaves_entregues: false,
        data_entrega: null,
        aceite_cliente_nome: "Cliente A",
        observacoes: "Nenhuma",
        obras: { nome: "Obra Teste" }
      }];
    }
    return [];
  }
  async upsertEntrega(empresaId: string, payload: any) {
    return Promise.resolve();
  }
  async countPendingComissionamento(empresaId: string, obraId: string) {
    if (obraId === "ob-blocked") return 5;
    return 0;
  }
}

test("EntregaService.listComissionamento maps data correctly", async () => {
  const deps: EntregaDeps = {
    getEmpresaId: async () => "emp-123",
    isMissingRelation: () => false,
  };
  const repo = new MockEntregaRepository();
  const service = new EntregaService(repo, deps);

  const result = await service.listComissionamento();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "c1");
  assert.strictEqual(result[0].obraNome, "Obra Teste");
});

test("EntregaService.upsertEntrega blocks if comissionamento is pending", async () => {
  const deps: EntregaDeps = {
    getEmpresaId: async () => "emp-123",
    isMissingRelation: () => false,
  };
  const repo = new MockEntregaRepository();
  const service = new EntregaService(repo, deps);

  await assert.rejects(
    service.upsertEntrega({
      obraId: "ob-blocked",
      status: "entregue",
      chavesEntregues: true,
      dataEntrega: "2026-01-01",
      aceiteClienteNome: "Cliente A",
      observacoes: "OK",
    }),
    { message: /Entrega bloqueada/ }
  );
});

test("EntregaService.upsertEntrega allows if comissionamento is clear", async () => {
  const deps: EntregaDeps = {
    getEmpresaId: async () => "emp-123",
    isMissingRelation: () => false,
  };
  const repo = new MockEntregaRepository();
  const service = new EntregaService(repo, deps);

  await service.upsertEntrega({
    obraId: "ob1",
    status: "entregue",
    chavesEntregues: true,
    dataEntrega: "2026-01-01",
    aceiteClienteNome: "Cliente A",
    observacoes: "OK",
  });
  // Should not throw
});
