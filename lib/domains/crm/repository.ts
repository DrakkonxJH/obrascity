import { SupabaseClient } from "@supabase/supabase-js";
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
import { measureDuration } from "@/lib/observability/logger";
import { cacheGet, cacheSet, generateCacheKey } from "@/lib/cache/redis";

export interface ICrmRepository {
  listLeads(empresaId: string): Promise<any[]>;
  upsertLead(empresaId: string, input: any): Promise<any>;
  deleteLead(empresaId: string, id: string): Promise<void>;
  listDealsSummary(empresaId: string): Promise<any[]>;
  listActivities(empresaId: string, dealId: string): Promise<any[]>;
  createActivity(empresaId: string, payload: any): Promise<any>;
  updateActivity(empresaId: string, activityId: string, payload: any): Promise<any>;
  updateDeal(empresaId: string, dealId: string, payload: any): Promise<any>;
  createDeal(empresaId: string, payload: any): Promise<any>;
  deleteDeal(empresaId: string, dealId: string): Promise<void>;
  listLossReasons(empresaId: string): Promise<any[]>;
  listAssignableProfiles(empresaId: string): Promise<any[]>;
  runFollowupAutomation(empresaId: string): Promise<any[]>;
  listWorkspaces(empresaId: string): Promise<any[]>;
  createWorkspace(empresaId: string, payload: any): Promise<any>;
  updateWorkspace(empresaId: string, id: string, payload: any): Promise<any>;
  deleteWorkspace(empresaId: string, id: string): Promise<void>;
  listDealsByWorkspace(empresaId: string, workspaceId?: string): Promise<any[]>;
  listCustomTabs(empresaId: string, workspaceId?: string): Promise<any[]>;
  createCustomTab(empresaId: string, payload: any): Promise<any>;
  updateCustomTab(empresaId: string, id: string, payload: any): Promise<any>;
  deleteCustomTab(empresaId: string, id: string): Promise<void>;
  listSectors(empresaId: string): Promise<any[]>;
  upsertSector(empresaId: string, payload: any): Promise<any>;
  listWorkflowSteps(empresaId: string): Promise<any[]>;
  upsertWorkflowSteps(empresaId: string, payload: any[]): Promise<void>;
  listCronogramaTasks(empresaId: string): Promise<any[]>;
  findLeadIdByCronogramaTaskId(empresaId: string, taskId: string): Promise<string | null>;

  // Helper methods for lead-deal sync
  ensureCompanyId(empresaId: string, name: string): Promise<string | null>;
  ensureContactId(empresaId: string, contact: any): Promise<string | null>;
  findObraIdByName(empresaId: string, name: string): Promise<string | null>;
  findDealByLeadTag(empresaId: string, tag: string): Promise<any>;
  deleteDealActivities(empresaId: string, dealId: string): Promise<void>;
}

export class SupabaseCrmRepository implements ICrmRepository {
  constructor(private supabase: SupabaseClient) {}

  async listLeads(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listLeads", async () => {
      const { data, error } = await this.supabase
        .from("crm_leads")
        .select("id, empresa_id, nome, contato, cargo, email, telefone, valor, etapa, origem, obra, prioridade, ultima_atividade, notas, created_at, updated_at")
        .eq("empresa_id", empresaId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async upsertLead(empresaId: string, input: any): Promise<any> {
    return measureDuration("crm.upsertLead", async () => {
      const { data, error } = await this.supabase
        .from("crm_leads")
        .upsert({ ...input, empresa_id: empresaId }, { onConflict: "id" })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }, { empresaId });
  }

  async deleteLead(empresaId: string, id: string): Promise<void> {
    return measureDuration("crm.deleteLead", async () => {
      const { error } = await this.supabase.from("crm_leads").delete().eq("empresa_id", empresaId).eq("id", id);
      if (error) throw error;
    }, { empresaId, id });
  }

  async listDealsSummary(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listDealsSummary", async () => {
      const cacheKey = generateCacheKey("crm", "dealsSummary", { empresaId });
      const cached = await cacheGet<any[]>(cacheKey);
      if (cached) return cached;

      const { data, error } = await this.supabase
        .from("crm_deals")
        .select("id, nome, stage, status, priority, probability, valor, last_activity_at, next_activity_at, tags, owner_profile_id, loss_reason, custom_fields, playbook_items, company:crm_companies!crm_deals_company_id_fkey(nome), contact:crm_contacts!crm_deals_contact_id_fkey(nome), owner:profiles!crm_deals_owner_profile_id_fkey(nome)")
        .eq("empresa_id", empresaId)
        .order("updated_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      const result = data ?? [];
      await cacheSet(cacheKey, result, 300);
      return result;
    }, { empresaId });
  }

  async listActivities(empresaId: string, dealId: string): Promise<any[]> {
    return measureDuration("crm.listActivities", async () => {
      const { data, error } = await this.supabase
        .from("crm_activities")
        .select("id, empresa_id, deal_id, type, subject, body, channel, due_at, completed_at, done, created_at, updated_at")
        .eq("empresa_id", empresaId)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }, { empresaId, dealId });
  }

  async createActivity(empresaId: string, payload: any): Promise<any> {
    return measureDuration("crm.createActivity", async () => {
      const { data, error } = await this.supabase.from("crm_activities").insert(payload).select("*").single();
      if (error) throw error;
      return data;
    }, { empresaId });
  }

  async updateActivity(empresaId: string, activityId: string, payload: any): Promise<any> {
    return measureDuration("crm.updateActivity", async () => {
      const { data, error } = await this.supabase
        .from("crm_activities")
        .update(payload)
        .eq("empresa_id", empresaId)
        .eq("id", activityId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }, { empresaId, activityId });
  }

  async updateDeal(empresaId: string, dealId: string, payload: any): Promise<any> {
    return measureDuration("crm.updateDeal", async () => {
      const { data, error } = await this.supabase
        .from("crm_deals")
        .update(payload)
        .eq("empresa_id", empresaId)
        .eq("id", dealId)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    }, { empresaId, dealId });
  }

  async createDeal(empresaId: string, payload: any): Promise<any> {
    return measureDuration("crm.createDeal", async () => {
      const { data, error } = await this.supabase.from("crm_deals").insert(payload).select("id").single();
      if (error) throw error;
      return data;
    }, { empresaId });
  }

  async deleteDeal(empresaId: string, dealId: string): Promise<void> {
    return measureDuration("crm.deleteDeal", async () => {
      const { error } = await this.supabase.from("crm_deals").delete().eq("empresa_id", empresaId).eq("id", dealId);
      if (error) throw error;
    }, { empresaId, dealId });
  }

  async listLossReasons(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listLossReasons", async () => {
      const { data, error } = await this.supabase
        .from("crm_deals")
        .select("loss_reason, valor")
        .eq("empresa_id", empresaId)
        .eq("status", "perdido")
        .neq("loss_reason", "");
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async listAssignableProfiles(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listAssignableProfiles", async () => {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id, nome, email, role, empresa_id")
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async runFollowupAutomation(empresaId: string): Promise<any[]> {
    return measureDuration("crm.runFollowupAutomation", async () => {
      const { data, error } = await this.supabase
        .from("crm_deals")
        .select("id, nome, stage, status")
        .eq("empresa_id", empresaId)
        .eq("status", "aberto");
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async listWorkspaces(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listWorkspaces", async () => {
      const { data, error } = await this.supabase
        .from("crm_workspaces")
        .select("*")
        .eq("company_id", empresaId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async createWorkspace(empresaId: string, payload: any): Promise<any> {
    return measureDuration("crm.createWorkspace", async () => {
      const { data, error } = await this.supabase.from("crm_workspaces").insert(payload).select("*").single();
      if (error) throw error;
      return data;
    }, { empresaId });
  }

  async updateWorkspace(empresaId: string, id: string, payload: any): Promise<any> {
    return measureDuration("crm.updateWorkspace", async () => {
      const { data, error } = await this.supabase
        .from("crm_workspaces")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", empresaId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }, { empresaId, id });
  }

  async deleteWorkspace(empresaId: string, id: string): Promise<void> {
    return measureDuration("crm.deleteWorkspace", async () => {
      const { error } = await this.supabase.from("crm_workspaces").delete().eq("id", id).eq("company_id", empresaId);
      if (error) throw error;
    }, { empresaId, id });
  }

  async listDealsByWorkspace(empresaId: string, workspaceId?: string): Promise<any[]> {
    return measureDuration("crm.listDealsByWorkspace", async () => {
      let query = this.supabase
        .from("crm_deals")
        .select("id, nome, stage, status, priority, probability, valor, last_activity_at, next_activity_at, tags, owner_profile_id, loss_reason, custom_fields, playbook_items, company:crm_companies!crm_deals_company_id_fkey(nome), contact:crm_contacts!crm_deals_contact_id_fkey(nome), owner:profiles!crm_deals_owner_profile_id_fkey(nome)")
        .eq("empresa_id", empresaId)
        .order("updated_at", { ascending: false })
        .limit(120);

      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      } else {
        query = query.is("workspace_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }, { empresaId, workspaceId });
  }

  async listCustomTabs(empresaId: string, workspaceId?: string): Promise<any[]> {
    return measureDuration("crm.listCustomTabs", async () => {
      let query = this.supabase
        .from("crm_custom_tabs")
        .select("*")
        .eq("company_id", empresaId);

      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      } else {
        query = query.is("workspace_id", null);
      }

      const { data, error } = await query.order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }, { empresaId, workspaceId });
  }

  async createCustomTab(empresaId: string, payload: any): Promise<any> {
    return measureDuration("crm.createCustomTab", async () => {
      const { data, error } = await this.supabase.from("crm_custom_tabs").insert(payload).select("*").single();
      if (error) throw error;
      return data;
    }, { empresaId });
  }

  async updateCustomTab(empresaId: string, id: string, payload: any): Promise<any> {
    return measureDuration("crm.updateCustomTab", async () => {
      const { data, error } = await this.supabase
        .from("crm_custom_tabs")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", empresaId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }, { empresaId, id });
  }

  async deleteCustomTab(empresaId: string, id: string): Promise<void> {
    return measureDuration("crm.deleteCustomTab", async () => {
      const { error } = await this.supabase.from("crm_custom_tabs").delete().eq("id", id).eq("company_id", empresaId);
      if (error) throw error;
    }, { empresaId, id });
  }

  async listSectors(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listSectors", async () => {
      const { data, error } = await this.supabase
        .from("crm_sectors")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async upsertSector(empresaId: string, payload: any): Promise<any> {
    return measureDuration("crm.upsertSector", async () => {
      const { data, error } = await this.supabase.from("crm_sectors").upsert(payload).select("*").single();
      if (error) throw error;
      return data;
    }, { empresaId });
  }

  async listWorkflowSteps(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listWorkflowSteps", async () => {
      const { data, error } = await this.supabase
        .from("crm_workflow_steps")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("step_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async upsertWorkflowSteps(empresaId: string, payload: any[]): Promise<void> {
    return measureDuration("crm.upsertWorkflowSteps", async () => {
      const { error } = await this.supabase.from("crm_workflow_steps").upsert(payload);
      if (error) throw error;
    }, { empresaId });
  }

  async ensureCompanyId(empresaId: string, name: string): Promise<string | null> {
    return measureDuration("crm.ensureCompanyId", async () => {
      const clean = name.trim();
      if (!clean) return null;
      const { data, error } = await this.supabase
        .from("crm_companies")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("nome", clean)
        .maybeSingle<{ id: string }>();
      if (error) throw error;
      if (data?.id) return data.id;
      const created = await this.supabase.from("crm_companies").insert({ empresa_id: empresaId, nome }).select("id").single<{ id: string }>();
      if (created.error || !created.data?.id) throw created.error || new Error("Falha ao criar empresa CRM");
      return created.data.id;
    }, { empresaId, name });
  }

  async ensureContactId(empresaId: string, contact: any): Promise<string | null> {
    return measureDuration("crm.ensureContactId", async () => {
      const { nome, email, telefone, cargo, companyId } = contact;
      const cleanNome = (nome || "").trim();
      if (!cleanNome) return null;
      const cleanEmail = (email || "").trim();
      let existingId: string | null = null;
      if (cleanEmail) {
        const { data, error } = await this.supabase.from("crm_contacts").select("id").eq("empresa_id", empresaId).eq("email", cleanEmail).maybeSingle<{ id: string }>();
        if (error) throw error;
        existingId = data?.id ?? null;
      }
      if (!existingId) {
        const { data, error } = await this.supabase.from("crm_contacts").select("id").eq("empresa_id", empresaId).eq("nome", cleanNome).maybeSingle<{ id: string }>();
        if (error) throw error;
        existingId = data?.id ?? null;
      }
      const payload = {
        empresa_id: empresaId,
        company_id: companyId,
        nome: cleanNome,
        email: cleanEmail || null,
        telefone: (telefone || "").trim() || null,
        cargo: (cargo || "").trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (existingId) {
        const { data, error } = await this.supabase.from("crm_contacts").update(payload).eq("empresa_id", empresaId).eq("id", existingId).select("id").single<{ id: string }>();
        if (error || !data?.id) throw error || new Error("Erro ao atualizar contato");
        return data.id;
      }
      const created = await this.supabase.from("crm_contacts").insert(payload).select("id").single<{ id: string }>();
      if (created.error || !created.data?.id) throw created.error || new Error("Erro ao criar contato");
      return created.data.id;
    }, { empresaId, contact });
  }

  async findObraIdByName(empresaId: string, name: string): Promise<string | null> {
    return measureDuration("crm.findObraIdByName", async () => {
      const clean = name.trim();
      if (!clean) return null;
      const { data, error } = await this.supabase.from("obras").select("id").eq("empresa_id", empresaId).eq("nome", clean).maybeSingle<{ id: string }>();
      if (error) throw error;
      return data?.id ?? null;
    }, { empresaId, name });
  }

  async findDealByLeadTag(empresaId: string, tag: string): Promise<any> {
    return measureDuration("crm.findDealByLeadTag", async () => {
      const { data, error } = await this.supabase.from("crm_deals").select("id, tags").eq("empresa_id", empresaId).contains("tags", [tag]).maybeSingle<{ id: string; tags: string[] | null }>();
      if (error) throw error;
      return data;
    }, { empresaId, tag });
  }

  async deleteDealActivities(empresaId: string, dealId: string): Promise<void> {
    return measureDuration("crm.deleteDealActivities", async () => {
      const { error } = await this.supabase.from("crm_activities").delete().eq("empresa_id", empresaId).eq("deal_id", dealId);
      if (error) throw error;
    }, { empresaId, dealId });
  }

  async listCronogramaTasks(empresaId: string): Promise<any[]> {
    return measureDuration("crm.listCronogramaTasks", async () => {
      const { data, error } = await this.supabase
        .from("obras_tarefas")
        .select("id, empresa_id, nome, status, inicio, fim, created_at, obra_id, obras(nome, cliente)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }, { empresaId });
  }

  async findLeadIdByCronogramaTaskId(empresaId: string, taskId: string): Promise<string | null> {
    return measureDuration("crm.findLeadIdByCronogramaTaskId", async () => {
      const marker = `[cronograma_task_id:${taskId}]`;
      const { data, error } = await this.supabase
        .from("crm_leads")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("origem", "Cronograma")
        .ilike("notas", `%${marker}%`)
        .limit(1)
        .maybeSingle<{ id: string }>();
      if (error) throw error;
      return data?.id ?? null;
    }, { empresaId, taskId });
  }
}
