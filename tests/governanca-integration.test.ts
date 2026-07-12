import test from "node:test";
import assert from "node:assert/strict";
import { GovernancaService, GovernancaDeps } from "@/lib/domains/governanca/service";
import { IGovernancaRepository } from "@/lib/domains/governanca/repository";

class MockGovernancaRepository implements IGovernancaRepository {
  async getRetentionPolicy(empresaId: string) {
    if (empresaId === "emp-123") {
      return {
        audit_retention_days: 365,
        report_retention_days: 365,
        log_retention_days: 180,
      };
    }
    return null;
  }
  async upsertRetentionPolicy(empresaId: string, payload: any) {
    return Promise.resolve();
  }
  async listAuditLogs(empresaId: string, limit: number) {
    return [{
      id: "a1",
      acao: "update",
      entidade: "obra",
      entidade_id: "ob1",
      actor_id: "u1",
      metadata: { diff: { name: "New Name" } },
      created_at: "now"
    }];
  }
  async listObservabilityEvents(empresaId: string, limit: number) {
    return [{
      id: "e1",
      source: "system",
      event_type: "critical_error",
      severity: "error",
      message: "Disk full",
      created_at: "now"
    }];
  }
  async registerSyncEvent(empresaId: string, payload: any) {
    return Promise.resolve();
  }
  async countOpenNCs(empresaId: string) {
    return 10;
  }
  async countPendingApprovals(empresaId: string) {
    return 5;
  }
  async countOverdueFinance(empresaId: string) {
    return 2;
  }
  async listGarantiaChamados(empresaId: string) {
    return [{
      id: "g1",
      prazo_solucao_em: "2020-01-01", // Overdue
      prazo_resposta_em: null,
      status: "aberto"
    }];
  }
  async countPendingComissionamento(empresaId: string) {
    return 3;
  }
}

test("GovernancaService.getRetentionPolicy maps data correctly", async () => {
  const deps: GovernancaDeps = {
    getEmpresaId: async () => "emp-123",
    isMissingRelation: () => false,
  };
  const repo = new MockGovernancaRepository();
  const service = new GovernancaService(repo, deps);

  const result = await service.getRetentionPolicy();
  assert.strictEqual(result?.auditRetentionDays, 365);
});

test("GovernancaService.listRecentAuditLogs calculates diffCount", async () => {
  const deps: GovernancaDeps = {
    getEmpresaId: async () => "emp-123",
    isMissingRelation: () => false,
  };
  const repo = new MockGovernancaRepository();
  const service = new GovernancaService(repo, deps);

  const result = await service.listRecentAuditLogs();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].diffCount, 1);
});

test("GovernancaService.listExecutiveAlerts aggregates critical items", async () => {
  const deps: GovernancaDeps = {
    getEmpresaId: async () => "emp-123",
    isMissingRelation: () => false,
  };
  const repo = new MockGovernancaRepository();
  const service = new GovernancaService(repo, deps);

  const result = await service.listExecutiveAlerts();
  // Expecting: NCs, Approvals, Finance, Garantia, Comissionamento
  assert.strictEqual(result.length, 5);
  assert.strictEqual(result.find(a => a.id === "nc-open")?.severity, "error"); // > 8
  assert.strictEqual(result.find(a => a.id === "approvals-pending")?.severity, "warning"); // <= 10
});
