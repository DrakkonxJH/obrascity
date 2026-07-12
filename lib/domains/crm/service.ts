import { ICrmRepository } from "./repository";
import {
  CrmLead,
  CrmDealSummary,
  CrmDealActivity,
  CrmWorkspace,
  CrmCustomTab,
  CrmSector,
  CrmWorkflowStep,
  UpsertCrmLeadInput,
  UpdateCrmDealInput,
  CreateCrmDealInput,
  CrmDealActivityInput
} from "./entities";
import { logDomainError, logInfraError } from "@/lib/observability/logger";
import { getCurrentUser } from "@/lib/auth/session";

export type CrmServiceDeps = {
  getEmpresaId: () => Promise<string>;
  getCurrentProfile: () => Promise<any>;
};

export class CrmService {
  constructor(
    private repository: ICrmRepository,
    private deps: CrmServiceDeps
  ) {}

  // --- Normalization Helpers ---
  private mapLeadEtapaToDealStage(etapa: CrmLead["etapa"]): string {
    if (etapa === "Contato") return "novos";
    if (etapa === "Qualificação") return "qualificacao";
    if (etapa === "Proposta") return "proposta";
    if (etapa === "Negociação") return "negociacao";
    if (etapa === "Fechado") return "ganho";
    return "perdido";
  }

  private mapLeadEtapaToDealStatus(etapa: CrmLead["etapa"]): "aberto" | "ganho" | "perdido" {
    if (etapa === "Fechado") return "ganho";
    if (etapa === "Perdido") return "perdido";
    return "aberto";
  }

  private mapLeadPrioridadeToDealPriority(prioridade: CrmLead["prioridade"]): "alta" | "media" | "baixa" {
    if (prioridade === "Alta") return "alta";
    if (prioridade === "Baixa") return "baixa";
    return "media";
  }

  private normalizeDealStage(stage: string) {
    const normalized = String(stage ?? "").trim().toLowerCase();
    if (normalized === "novos") return "novos";
    if (normalized === "qualificacao") return "qualificacao";
    if (normalized === "proposta") return "proposta";
    if (normalized === "negociacao") return "negociacao";
    if (normalized === "ganho") return "ganho";
    if (normalized === "perdido") return "perdido";
    return "novos";
  }

  private normalizeDealPriority(priority: string) {
    const normalized = String(priority ?? "").trim().toLowerCase();
    if (normalized === "alta") return "alta";
    if (normalized === "baixa") return "baixa";
    return "media";
  }

  private normalizeActivityType(type: string) {
    const normalized = String(type ?? "").trim().toLowerCase();
    if (normalized === "ligacao" || normalized === "call") return "call";
    if (normalized === "email" || normalized === "e-mail") return "email";
    if (normalized === "reuniao" || normalized === "reunião") return "meeting";
    if (normalized === "proposta") return "proposal";
    if (normalized === "nota") return "note";
    if (normalized === "tarefa" || normalized === "task") return "task";
    return "follow_up";
  }

  private normalizeActivityChannel(channel: string) {
    const normalized = String(channel ?? "").trim().toLowerCase();
    if (["whatsapp", "email", "ligacao", "call", "reuniao", "meeting", "manual"].includes(normalized)) {
      return normalized;
    }
    return "manual";
  }

  private asIsoDateTime(dateOrIso: string | null) {
    if (!dateOrIso) return null;
    const maybe = new Date(dateOrIso);
    if (!Number.isFinite(maybe.getTime())) {
      return new Date().toISOString();
    }
    return maybe.toISOString();
  }

  private defaultDealProbability(stage: string) {
    if (stage === "ganho") return 100;
    if (stage === "perdido") return 0;
    if (stage === "negociacao") return 75;
    if (stage === "proposta") return 55;
    if (stage === "qualificacao") return 30;
    return 10;
  }

  private buildDefaultPlaybook(stage: string) {
    if (stage === "novos") {
      return [
        { id: "lead-source", label: "Validar origem e contexto do lead", done: false },
        { id: "primeiro-contato", label: "Realizar primeiro contato", done: false },
      ];
    }
    if (stage === "qualificacao") {
      return [
        { id: "dor-negocio", label: "Mapear dor principal do cliente", done: false },
        { id: "stakeholders", label: "Identificar decisor e influenciadores", done: false },
      ];
    }
    if (stage === "proposta") {
      return [
        { id: "escopo", label: "Definir escopo e premissas comerciais", done: false },
        { id: "proposta-enviada", label: "Enviar proposta formal", done: false },
      ];
    }
    if (stage === "negociacao") {
      return [
        { id: "objeções", label: "Documentar objeções e contrapartidas", done: false },
        { id: "decisao", label: "Definir data de decisão com cliente", done: false },
      ];
    }
    if (stage === "ganho") {
      return [
        { id: "onboarding", label: "Registrar handoff para operação/projeto", done: false },
        { id: "kickoff", label: "Agendar kickoff com cliente", done: false },
      ];
    }
    return [
      { id: "motivo-perda", label: "Registrar motivo detalhado da perda", done: false },
      { id: "aprendizado", label: "Documentar aprendizado comercial", done: false },
    ];
  }

  private normalizePlaybookItems(value: unknown, stage: string) {
    if (!Array.isArray(value)) return this.buildDefaultPlaybook(stage);
    const parsed = value
      .map((item) => {
        const source = item as Partial<{ id: string; label: string; done: boolean }>;
        const id = String(source.id ?? "").trim();
        const label = String(source.label ?? "").trim();
        if (!id || !label) return null;
        return { id, label, done: Boolean(source.done) };
      })
      .filter((item): item is { id: string; label: string; done: boolean } => Boolean(item));
    return parsed.length > 0 ? parsed : this.buildDefaultPlaybook(stage);
  }

  private normalizeCustomFields(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, fieldValue]) => [String(key).trim(), String(fieldValue ?? "").trim()] as const)
      .filter(([key]) => key.length > 0);
    return Object.fromEntries(entries);
  }

  private followupDelayByStage(stage: string) {
    if (stage === "novos") return 1;
    if (stage === "qualificacao") return 2;
    if (stage === "proposta") return 2;
    if (stage === "negociacao") return 1;
    return 0;
  }

  // --- Domain Logic ---

  async ensureDealAutomationFollowup(empresaId: string, dealId: string, stage: string, dealName: string) {
    if (stage === "ganho" || stage === "perdido") return;

    const activities = await this.repository.listActivities(empresaId, dealId);
    const openCount = activities.filter(a => !a.done).length;
    if (openCount > 0) return;

    const now = new Date();
    now.setDate(now.getDate() + this.followupDelayByStage(stage));
    now.setHours(9, 0, 0, 0);

    await this.repository.createActivity(empresaId, {
      deal_id: dealId,
      type: "follow_up",
      subject: `Follow-up automático · ${dealName}`,
      body: "Atividade criada automaticamente para manter o SLA comercial do negócio.",
      channel: "manual",
      due_at: now.toISOString(),
      done: false,
    });
    await this.refreshDealActivitySchedule(empresaId, dealId);
  }

  async refreshDealActivitySchedule(empresaId: string, dealId: string) {
    const activities = await this.repository.listActivities(empresaId, dealId);
    const openActivities = activities.filter(a => !a.done).sort((a, b) =>
      new Date(a.due_at ?? "9999").getTime() - new Date(b.due_at ?? "9999").getTime()
    );

    const nextActivityAt = openActivities[0]?.due_at ? String(openActivities[0].due_at) : null;
    const now = new Date().toISOString();
    await this.repository.updateDeal(empresaId, dealId, {
      next_activity_at: nextActivityAt,
      last_activity_at: now,
      updated_at: now,
    });
  }

  async syncLeadToDeal(empresaId: string, lead: CrmLead) {
    const leadTag = `lead:${lead.id}`;
    const companyId = await this.repository.ensureCompanyId(empresaId, lead.nome);
    const contactId = await this.repository.ensureContactId(empresaId, {
      nome: lead.contato,
      email: lead.email,
      telefone: lead.telefone,
      cargo: lead.cargo,
      companyId,
    });
    const obraId = await this.repository.findObraIdByName(empresaId, lead.obra);

    const existingDeal = await this.repository.findDealByLeadTag(empresaId, leadTag);

    const stage = this.normalizeDealStage(this.mapLeadEtapaToDealStage(lead.etapa));
    const basePayload = {
      company_id: companyId,
      contact_id: contactId,
      obra_id: obraId,
      nome: lead.obra?.trim() ? `${lead.nome} — ${lead.obra}` : lead.nome,
      descricao: lead.notas || null,
      stage: stage,
      status: this.mapLeadEtapaToDealStatus(lead.etapa),
      priority: this.normalizeDealPriority(this.mapLeadPrioridadeToDealPriority(lead.prioridade)),
      probability: this.defaultDealProbability(stage),
      valor: lead.valor ?? 0,
      last_activity_at: this.asIsoDateTime(lead.ultimaAtividade),
      next_activity_at: null,
      loss_reason: "",
      custom_fields: {},
      playbook_items: this.buildDefaultPlaybook(stage),
      updated_at: new Date().toISOString(),
    };

    let dealId: string;
    if (existingDeal?.id) {
      const tags = Array.from(new Set([...(existingDeal.tags ?? []), "lead-sync", leadTag]));
      const res = await this.repository.updateDeal(empresaId, existingDeal.id, { ...basePayload, tags });
      dealId = res.id;
    } else {
      const res = await this.repository.createDeal(empresaId, {
        ...basePayload,
        tags: ["lead-sync", leadTag],
      });
      dealId = res.id;
    }
    await this.ensureDealAutomationFollowup(empresaId, dealId, stage, lead.nome);
    return dealId;
  }

  async listLeads(): Promise<CrmLead[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listLeads(empresaId);
      return data.map(item => ({
        id: item.id,
        empresaId: item.empresa_id,
        nome: item.nome,
        contato: item.contato,
        cargo: item.cargo,
        email: item.email,
        telefone: item.telefone,
        valor: item.valor,
        etapa: item.etapa,
        origem: item.origem,
        obra: item.obra,
        prioridade: item.prioridade,
        ultimaAtividade: item.ultima_atividade,
        notas: item.notas,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listLeads" });
      throw error;
    }
  }

  async listDealsSummary(): Promise<CrmDealSummary[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listDealsSummary(empresaId);

      return rows.map(row => ({
        id: row.id,
        nome: row.nome,
        stage: row.stage,
        status: row.status,
        priority: row.priority,
        probability: row.probability,
        valor: row.valor,
        companyName: row.company?.nome ?? "",
        contactName: row.contact?.nome ?? "",
        ownerProfileId: row.owner_profile_id,
        ownerName: row.owner?.nome ?? "",
        lastActivityAt: row.last_activity_at,
        nextActivityAt: row.next_activity_at,
        activitiesTotal: 0, // Need bulk fetch
        activitiesOpen: 0,
        tags: Array.isArray(row.tags) ? row.tags : [],
        lossReason: row.loss_reason,
        customFields: this.normalizeCustomFields(row.custom_fields),
        playbookItems: this.normalizePlaybookItems(row.playbook_items, row.stage),
        fvsSigned: Boolean(row.fvs_signed),
        fvsSignedBy: row.fvs_signed_by,
        fvsSignedDate: row.fvs_signed_date,
        fvsHash: row.fvs_hash,
        comments: Array.isArray(row.comments) ? row.comments : [],
        logs: Array.isArray(row.logs) ? row.logs : [],
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listDealsSummary" });
      throw error;
    }
  }

  async createLead(input: UpsertCrmLeadInput) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const lead = await this.repository.upsertLead(empresaId, input);
      await this.syncLeadToDeal(empresaId, lead);
      return lead;
    } catch (error: any) {
      logDomainError(error, { action: "createLead", input });
      throw error;
    }
  }

  async updateLeadStage(id: string, etapa: CrmLead["etapa"]) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const lead = await this.repository.upsertLead(empresaId, { id, etapa, ultimaAtividade: new Date().toISOString().slice(0, 10) });
      await this.syncLeadToDeal(empresaId, lead);
      return lead;
    } catch (error: any) {
      logDomainError(error, { action: "updateLeadStage", id, etapa });
      throw error;
    }
  }

  async deleteLead(id: string) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const leads = await this.repository.listLeads(empresaId);
      const target = leads.find(l => l.id === id);
      if (target) {
        const deal = await this.repository.findDealByLeadTag(empresaId, `lead:${id}`);
        if (deal) {
          await this.repository.deleteDealActivities(empresaId, deal.id);
          await this.repository.deleteDeal(empresaId, deal.id);
        }
      }
      await this.repository.deleteLead(empresaId, id);
    } catch (error: any) {
      logDomainError(error, { action: "deleteLead", id });
      throw error;
    }
  }

  async listActivities(dealId: string): Promise<CrmDealActivity[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.listActivities(empresaId, dealId);
    } catch (error: any) {
      logInfraError(error, { action: "listActivities", dealId });
      return [];
    }
  }

  async createDealActivity(dealId: string, input: CrmDealActivityInput) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const now = new Date().toISOString();
      const payload = {
        empresa_id: empresaId,
        deal_id: dealId,
        type: this.normalizeActivityType(input.type),
        subject: String(input.subject ?? "").trim(),
        body: String(input.body ?? "").trim(),
        channel: this.normalizeActivityChannel(input.channel ?? "manual"),
        due_at: this.asIsoDateTime(input.dueAt ?? null),
        completed_at: input.done ? now : null,
        done: Boolean(input.done),
        updated_at: now,
      };
      if (!payload.subject) throw new Error("Assunto da atividade é obrigatório");
      const activity = await this.repository.createActivity(empresaId, payload);
      await this.refreshDealActivitySchedule(empresaId, dealId);
      return activity;
    } catch (error: any) {
      logDomainError(error, { action: "createDealActivity", dealId, input });
      throw error;
    }
  }

  async updateDealActivity(activityId: string, patch: Partial<CrmDealActivityInput>) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const now = new Date().toISOString();
      const current = await this.repository.updateActivity(empresaId, activityId, {
        ...patch,
        updated_at: now,
        completed_at: patch.done ? now : null,
      });
      await this.refreshDealActivitySchedule(empresaId, current.deal_id);
      return current;
    } catch (error: any) {
      logDomainError(error, { action: "updateDealActivity", activityId, patch });
      throw error;
    }
  }

  async updateDeal(dealId: string, patch: UpdateCrmDealInput) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const profile = await this.deps.getCurrentProfile();

      const nextStage = patch.stage ? this.normalizeDealStage(patch.stage) : "novos";
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        ...patch,
      };

      if (patch.stage) {
        updatePayload.stage = nextStage;
        updatePayload.probability = this.defaultDealProbability(nextStage);
      }

      const result = await this.repository.updateDeal(empresaId, dealId, updatePayload);
      await this.ensureDealAutomationFollowup(empresaId, dealId, nextStage, "Deal Name");
      return result;
    } catch (error: any) {
      logDomainError(error, { action: "updateDeal", dealId, patch });
      throw error;
    }
  }

  async createDeal(input: CreateCrmDealInput) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const profile = await this.deps.getCurrentProfile();

      const stage = this.normalizeDealStage(String(input.stage ?? "novos"));
      const payload = {
        empresa_id: empresaId,
        nome: input.nome,
        stage,
        status: this.mapLeadEtapaToDealStatus("Contato"),
        priority: this.normalizeDealPriority(String(input.priority ?? "media")),
        valor: input.valor ?? 0,
        owner_profile_id: input.ownerProfileId ?? profile?.id,
        tags: ["novo-crm"],
        updated_at: new Date().toISOString(),
      };

      const res = await this.repository.createDeal(empresaId, payload);
      await this.ensureDealAutomationFollowup(empresaId, res.id, stage, input.nome);
      return res;
    } catch (error: any) {
      logDomainError(error, { action: "createDeal", input });
      throw error;
    }
  }

  async deleteDeal(dealId: string) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.deleteDeal(empresaId, dealId);
    } catch (error: any) {
      logDomainError(error, { action: "deleteDeal", dealId });
      throw error;
    }
  }

  async listLossReasonsReport() {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listLossReasons(empresaId);
      const grouped = new Map<string, { reason: string; total: number; value: number }>();
      for (const row of data) {
        const reason = String(row.loss_reason ?? "").trim() || "Não informado";
        const slot = grouped.get(reason) ?? { reason, total: 0, value: 0 };
        slot.total += 1;
        slot.value += Number(row.valor ?? 0);
        grouped.set(reason, slot);
      }
      return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
    } catch (error: any) {
      logInfraError(error, { action: "listLossReasonsReport" });
      throw error;
    }
  }

  async listAssignableProfiles(): Promise<any[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listAssignableProfiles(empresaId);
      return data.map(p => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        role: p.role,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listAssignableProfiles" });
      throw error;
    }
  }

  async runFollowupAutomation() {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const deals = await this.repository.runFollowupAutomation(empresaId);
      let touched = 0;
      for (const deal of deals) {
        await this.ensureDealAutomationFollowup(empresaId, deal.id, deal.stage, deal.nome);
        touched++;
      }
      return { processed: touched };
    } catch (error: any) {
      logInfraError(error, { action: "runFollowupAutomation" });
      throw error;
    }
  }

  async listWorkspaces(): Promise<CrmWorkspace[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listWorkspaces(empresaId);
      return data.map(w => ({
        id: w.id,
        companyId: w.company_id,
        name: w.name,
        description: w.description,
        color: w.color,
        icon: w.icon,
        sortOrder: w.sort_order,
        isDefault: w.is_default,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listWorkspaces" });
      throw error;
    }
  }

  async createWorkspace(name: string, color: string = "#3B82F6", description?: string): Promise<CrmWorkspace> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const res = await this.repository.createWorkspace(empresaId, { name, color, description });
      return {
        id: res.id,
        companyId: empresaId,
        name: res.name,
        description: res.description,
        color: res.color,
        icon: res.icon,
        sortOrder: res.sort_order,
        isDefault: res.is_default,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
      };
    } catch (error: any) {
      logDomainError(error, { action: "createWorkspace", name });
      throw error;
    }
  }

  async updateWorkspace(id: string, updates: Partial<CrmWorkspace>): Promise<CrmWorkspace> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const res = await this.repository.updateWorkspace(empresaId, id, updates);
      return {
        id: res.id,
        companyId: res.company_id,
        name: res.name,
        description: res.description,
        color: res.color,
        icon: res.icon,
        sortOrder: res.sort_order,
        isDefault: res.is_default,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
      };
    } catch (error: any) {
      logDomainError(error, { action: "updateWorkspace", id, updates });
      throw error;
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.deleteWorkspace(empresaId, id);
    } catch (error: any) {
      logDomainError(error, { action: "deleteWorkspace", id });
      throw error;
    }
  }

  async listDealsByWorkspace(workspaceId?: string): Promise<CrmDealSummary[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const rows = await this.repository.listDealsByWorkspace(empresaId, workspaceId);
      return rows.map(row => ({
        id: row.id,
        nome: row.nome ?? "Negócio sem nome",
        stage: this.normalizeDealStage(row.stage),
        status: row.status,
        priority: this.normalizeDealPriority(row.priority),
        probability: row.probability,
        valor: row.valor,
        companyName: row.company?.nome ?? "Empresa",
        contactName: row.contact?.nome ?? "Contato",
        ownerProfileId: row.owner_profile_id,
        ownerName: row.owner?.nome ?? "Sem responsável",
        lastActivityAt: row.last_activity_at,
        nextActivityAt: row.next_activity_at,
        activitiesTotal: 0,
        activitiesOpen: 0,
        tags: Array.isArray(row.tags) ? row.tags : [],
        lossReason: row.loss_reason,
        customFields: this.normalizeCustomFields(row.custom_fields),
        playbookItems: this.normalizePlaybookItems(row.playbook_items, row.stage),
        fvsSigned: Boolean(row.fvs_signed),
        fvsSignedBy: row.fvs_signed_by,
        fvsSignedDate: row.fvs_signed_date,
        fvsHash: row.fvs_hash,
        comments: Array.isArray(row.comments) ? row.comments : [],
        logs: Array.isArray(row.logs) ? row.logs : [],
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listDealsByWorkspace" });
      throw error;
    }
  }

  async listCustomTabs(workspaceId?: string): Promise<CrmCustomTab[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listCustomTabs(empresaId, workspaceId);
      return data.map(t => ({
        id: t.id,
        companyId: t.company_id,
        workspaceId: t.workspace_id,
        name: t.name,
        description: t.description,
        color: t.color,
        icon: t.icon,
        filterEtapa: t.filter_etapa,
        filterPrioridade: t.filter_prioridade,
        filterOrigem: t.filter_origem,
        filterOwnerId: t.filter_owner_id,
        filterSearch: t.filter_search,
        sortOrder: t.sort_order,
        isDefault: t.is_default,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listCustomTabs" });
      throw error;
    }
  }

  async createCustomTab(name: string, workspaceId?: string, filters: any = {}) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const res = await this.repository.createCustomTab(empresaId, {
        name,
        workspace_id: workspaceId,
        ...filters,
      });
      return res;
    } catch (error: any) {
      logDomainError(error, { action: "createCustomTab", name });
      throw error;
    }
  }

  async updateCustomTab(id: string, updates: Partial<CrmCustomTab>) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const res = await this.repository.updateCustomTab(empresaId, id, updates);
      return res;
    } catch (error: any) {
      logDomainError(error, { action: "updateCustomTab", id, updates });
      throw error;
    }
  }

  async deleteCustomTab(id: string) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.deleteCustomTab(empresaId, id);
    } catch (error: any) {
      logDomainError(error, { action: "deleteCustomTab", id });
      throw error;
    }
  }

  async listSectors(): Promise<CrmSector[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listSectors(empresaId);
      return data.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        budgetLimit: s.budget_limit,
        empresaId: s.empresa_id,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listSectors" });
      throw error;
    }
  }

  async upsertSector(sector: Partial<CrmSector>) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const res = await this.repository.upsertSector(empresaId, sector);
      return res;
    } catch (error: any) {
      logDomainError(error, { action: "upsertSector", sector });
      throw error;
    }
  }

  async listWorkflowSteps(): Promise<CrmWorkflowStep[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listWorkflowSteps(empresaId);
      return data.map(s => ({
        id: s.id,
        stepOrder: s.step_order,
        sectorId: s.sector_id,
        stageName: s.stage_name,
        color: s.color,
        icon: s.icon,
        subtasks: s.subtasks,
        empresaId: s.empresa_id,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listWorkflowSteps" });
      throw error;
    }
  }

  async upsertWorkflowSteps(steps: any[]) {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.upsertWorkflowSteps(empresaId, steps);
      return { success: true };
    } catch (error: any) {
      logDomainError(error, { action: "upsertWorkflowSteps", steps });
      throw error;
    }
  }
}
