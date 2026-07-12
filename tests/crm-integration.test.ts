import test from "node:test";
import assert from "node:assert/strict";
import { CrmService, CrmServiceDeps } from "@/lib/domains/crm/service";
import { ICrmRepository } from "@/lib/domains/crm/repository";

class MockCrmRepository implements ICrmRepository {
  async listLeads(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "l1",
        empresa_id: "emp-123",
        nome: "Lead Teste",
        contato: "Contato Teste",
        etapa: "Contato",
        valor: 1000,
        origem: "Site",
        obra: "Obra Teste",
        prioridade: "Alta",
        ultima_atividade: "2026-01-01",
        notas: "Notas de teste",
        created_at: "now",
        updated_at: "now"
      }];
    }
    return [];
  }
  async upsertLead(empresaId: string, input: any) {
    return { ...input, id: input.id || "l-new", empresa_id: empresaId };
  }
  async deleteLead(empresaId: string, id: string) { return Promise.resolve(); }
  async listDealsSummary(empresaId: string) {
    if (empresaId === "emp-123") {
      return [{
        id: "d1",
        nome: "Deal Teste",
        stage: "novos",
        status: "aberto",
        priority: "alta",
        probability: 10,
        valor: 1000,
        company: { nome: "Empresa A" },
        contact: { nome: "João" },
        owner: { nome: "Admin" },
        tags: ["lead-sync", "l1"],
        loss_reason: "",
        custom_fields: {},
        playbook_items: [],
      }];
    }
    return [];
  }
  async listActivities(empresaId: string, dealId: string) {
    return [];
  }
  async createActivity(empresaId: string, payload: any) {
    return { id: "a1", ...payload };
  }
  async updateActivity(empresaId: string, activityId: string, payload: any) {
    return { id: activityId, ...payload };
  }
  async updateDeal(empresaId: string, dealId: string, payload: any) {
    return { id: dealId, ...payload };
  }
  async createDeal(empresaId: string, payload: any) {
    return { id: "d-new", ...payload };
  }
  async deleteDeal(empresaId: string, dealId: string) { return Promise.resolve(); }
  async listLossReasons(empresaId: string) { return []; }
  async listAssignableProfiles(empresaId: string) { return []; }
  async runFollowupAutomation(empresaId: string) { return []; }
  async listWorkspaces(empresaId: string) { return []; }
  async createWorkspace(empresaId: string, payload: any) { return { id: "w1", ...payload }; }
  async updateWorkspace(empresaId: string, id: string, payload: any) { return { id, ...payload }; }
  async deleteWorkspace(empresaId: string, id: string) { return Promise.resolve(); }
  async listDealsByWorkspace(empresaId: string, workspaceId?: string) { return []; }
  async listCustomTabs(empresaId: string, workspaceId?: string) { return []; }
  async createCustomTab(empresaId: string, payload: any) { return { id: "t1", ...payload }; }
  async updateCustomTab(empresaId: string, id: string, payload: any) { return { id, ...payload }; }
  async deleteCustomTab(empresaId: string, id: string) { return Promise.resolve(); }
  async listSectors(empresaId: string) { return []; }
  async upsertSector(empresaId: string, payload: any) { return { id: "s1", ...payload }; }
  async listWorkflowSteps(empresaId: string) { return []; }
  async upsertWorkflowSteps(empresaId: string, payload: any[]) { return Promise.resolve(); }
  async ensureCompanyId(empresaId: string, name: string) { return "comp-1"; }
  async ensureContactId(empresaId: string, contact: any) { return "cont-1"; }
  async findObraIdByName(empresaId: string, name: string) { return "ob-1"; }
  async findDealByLeadTag(empresaId: string, tag: string) {
    if (tag === "lead:l1") return { id: "d1", tags: ["lead-sync", "lead:l1"] };
    return null;
  }
  async deleteDealActivities(empresaId: string, dealId: string) { return Promise.resolve(); }
  async listCronogramaTasks(empresaId: string) { return []; }
  async findLeadIdByCronogramaTaskId(empresaId: string, taskId: string) { return null; }
}

test("CrmService.listLeads maps data correctly", async () => {
  const deps: CrmServiceDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentProfile: async () => ({ id: "u1", nome: "User" }),
  };
  const repo = new MockCrmRepository();
  const service = new CrmService(repo, deps);

  const result = await service.listLeads();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].nome, "Lead Teste");
});

test("CrmService.syncLeadToDeal creates or updates deal", async () => {
  const deps: CrmServiceDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentProfile: async () => ({ id: "u1", nome: "User" }),
  };
  const repo = new MockCrmRepository();
  const service = new CrmService(repo, deps);

  const lead: any = {
    id: "l1",
    nome: "Lead Teste",
    contato: "João",
    email: "joao@test.com",
    etapa: "Contato",
    valor: 1000,
    obra: "Obra Teste",
    prioridade: "Alta",
    ultimaAtividade: "2026-01-01",
  };

  const dealId = await service.syncLeadToDeal("emp-123", lead);
  assert.strictEqual(dealId, "d1");
});

test("CrmService.createLead syncs to deal", async () => {
  const deps: CrmServiceDeps = {
    getEmpresaId: async () => "emp-123",
    getCurrentProfile: async () => ({ id: "u1", nome: "User" }),
  };
  const repo = new MockCrmRepository();
  const service = new CrmService(repo, deps);

  const lead = await service.createLead({
    nome: "New Lead",
    contato: "New Contact",
    valor: 500,
  });
  assert.strictEqual(lead.id, "l-new");
});
