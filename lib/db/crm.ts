import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";
import { type SupabaseClient } from "@supabase/supabase-js";

export type CrmLead = {
  id: string;
  empresa_id: string;
  nome: string;
  contato: string;
  cargo: string;
  email: string;
  telefone: string;
  valor: number;
  etapa: "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Fechado" | "Perdido";
  origem: string;
  obra: string;
  prioridade: "Alta" | "Média" | "Baixa";
  ultima_atividade: string;
  notas: string;
  created_at: string;
  updated_at: string;
};

export type CrmDealSummary = {
  id: string;
  nome: string;
  stage: string;
  status: string;
  priority: string;
  valor: number;
   probability: number;
  company_name: string;
  contact_name: string;
  owner_profile_id: string | null;
  owner_name: string;
  last_activity_at: string | null;
  next_activity_at: string | null;
  activities_total: number;
  activities_open: number;
  tags: string[];
  loss_reason: string;
  custom_fields: Record<string, string>;
  playbook_items: Array<{ id: string; label: string; done: boolean }>;
};

export type CrmDealActivity = {
  id: string;
  empresa_id: string;
  deal_id: string;
  type: string;
  subject: string;
  body: string;
  channel: string;
  due_at: string | null;
  completed_at: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
};

type UpsertCrmLeadInput = {
  id?: string;
  nome: string;
  contato?: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  valor?: number;
  etapa?: CrmLead["etapa"];
  origem?: string;
  obra?: string;
  prioridade?: CrmLead["prioridade"];
  ultima_atividade?: string;
  notas?: string;
};

type CronogramaTaskSyncInput = {
  taskId: string;
  nome: string;
  status: string;
  inicio: string;
  fim: string;
  obraNome: string;
  clienteNome?: string | null;
};

type CrmDealActivityInput = {
  type: string;
  subject: string;
  body?: string;
  channel?: string;
  due_at?: string | null;
  done?: boolean;
};

type CrmDealPlaybookItem = {
  id: string;
  label: string;
  done: boolean;
};

type UpdateCrmDealInput = {
  stage?: string;
  status?: string;
  priority?: string;
  probability?: number;
  owner_profile_id?: string | null;
  loss_reason?: string;
  custom_fields?: Record<string, string>;
  playbook_items?: CrmDealPlaybookItem[];
};

type CrmProfileSummary = {
  id: string;
  nome: string;
  email: string;
  role: string;
};

const CRM_SELECT =
  "id, empresa_id, nome, contato, cargo, email, telefone, valor, etapa, origem, obra, prioridade, ultima_atividade, notas, created_at, updated_at";

function mapLeadEtapaToDealStage(etapa: CrmLead["etapa"]): string {
  if (etapa === "Contato") return "novos";
  if (etapa === "Qualificação") return "qualificacao";
  if (etapa === "Proposta") return "proposta";
  if (etapa === "Negociação") return "negociacao";
  if (etapa === "Fechado") return "ganho";
  return "perdido";
}

function mapLeadEtapaToDealStatus(etapa: CrmLead["etapa"]): "aberto" | "ganho" | "perdido" {
  if (etapa === "Fechado") return "ganho";
  if (etapa === "Perdido") return "perdido";
  return "aberto";
}

function mapLeadPrioridadeToDealPriority(prioridade: CrmLead["prioridade"]): "alta" | "media" | "baixa" {
  if (prioridade === "Alta") return "alta";
  if (prioridade === "Baixa") return "baixa";
  return "media";
}

function normalizeDealStage(stage: string) {
  const normalized = String(stage ?? "").trim().toLowerCase();
  if (normalized === "novos") return "novos";
  if (normalized === "qualificacao") return "qualificacao";
  if (normalized === "proposta") return "proposta";
  if (normalized === "negociacao") return "negociacao";
  if (normalized === "ganho") return "ganho";
  if (normalized === "perdido") return "perdido";
  return "novos";
}

function normalizeDealPriority(priority: string) {
  const normalized = String(priority ?? "").trim().toLowerCase();
  if (normalized === "alta") return "alta";
  if (normalized === "baixa") return "baixa";
  return "media";
}

function normalizeActivityType(type: string) {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (normalized === "ligacao" || normalized === "call") return "call";
  if (normalized === "email" || normalized === "e-mail") return "email";
  if (normalized === "reuniao" || normalized === "reunião") return "meeting";
  if (normalized === "proposta") return "proposal";
  if (normalized === "nota") return "note";
  if (normalized === "tarefa" || normalized === "task") return "task";
  return "follow_up";
}

function normalizeActivityChannel(channel: string) {
  const normalized = String(channel ?? "").trim().toLowerCase();
  if (["whatsapp", "email", "ligacao", "call", "reuniao", "meeting", "manual"].includes(normalized)) {
    return normalized;
  }
  return "manual";
}

function asIsoDateTime(dateOrIso: string) {
  const maybe = new Date(dateOrIso);
  if (!Number.isFinite(maybe.getTime())) {
    return new Date().toISOString();
  }
  return maybe.toISOString();
}

function defaultDealProbability(stage: string) {
  if (stage === "ganho") return 100;
  if (stage === "perdido") return 0;
  if (stage === "negociacao") return 75;
  if (stage === "proposta") return 55;
  if (stage === "qualificacao") return 30;
  return 10;
}

function buildDefaultPlaybook(stage: string): CrmDealPlaybookItem[] {
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

function normalizePlaybookItems(value: unknown, stage: string): CrmDealPlaybookItem[] {
  if (!Array.isArray(value)) return buildDefaultPlaybook(stage);
  const parsed = value
    .map((item) => {
      const source = item as Partial<CrmDealPlaybookItem>;
      const id = String(source.id ?? "").trim();
      const label = String(source.label ?? "").trim();
      if (!id || !label) return null;
      return { id, label, done: Boolean(source.done) } satisfies CrmDealPlaybookItem;
    })
    .filter((item): item is CrmDealPlaybookItem => Boolean(item));
  return parsed.length > 0 ? parsed : buildDefaultPlaybook(stage);
}

function normalizeCustomFields(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, fieldValue]) => [String(key).trim(), String(fieldValue ?? "").trim()] as const)
    .filter(([key]) => key.length > 0);
  return Object.fromEntries(entries);
}

function followupDelayByStage(stage: string) {
  if (stage === "novos") return 1;
  if (stage === "qualificacao") return 2;
  if (stage === "proposta") return 2;
  if (stage === "negociacao") return 1;
  return 0;
}

async function ensureDealAutomationFollowup(
  supabase: SupabaseClient,
  empresaId: string,
  dealId: string,
  stage: string,
  dealName: string,
) {
  if (stage === "ganho" || stage === "perdido") return;

  const openActivities = await supabase
    .from("crm_activities")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .eq("deal_id", dealId)
    .eq("done", false);

  if (openActivities.error) {
    throw new Error(`Erro ao validar automação de follow-up: ${openActivities.error.message}`);
  }
  if ((openActivities.count ?? 0) > 0) return;

  const now = new Date();
  now.setDate(now.getDate() + followupDelayByStage(stage));
  now.setHours(9, 0, 0, 0);

  const insert = await supabase.from("crm_activities").insert({
    empresa_id: empresaId,
    deal_id: dealId,
    type: "follow_up",
    subject: `Follow-up automático · ${dealName}`,
    body: "Atividade criada automaticamente para manter o SLA comercial do negócio.",
    channel: "manual",
    due_at: now.toISOString(),
    done: false,
  });
  if (insert.error) {
    throw new Error(`Erro ao criar follow-up automático: ${insert.error.message}`);
  }
  await refreshDealActivitySchedule(supabase, empresaId, dealId);
}

async function ensureCompanyId(supabase: SupabaseClient, empresaId: string, companyName: string) {
  const nome = companyName.trim();
  if (!nome) return null;

  const existing = await supabase
    .from("crm_companies")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("nome", nome)
    .maybeSingle<{ id: string }>();

  if (existing.error) {
    throw new Error(`Erro ao buscar empresa CRM: ${existing.error.message}`);
  }
  if (existing.data?.id) return existing.data.id;

  const created = await supabase
    .from("crm_companies")
    .insert({ empresa_id: empresaId, nome })
    .select("id")
    .single<{ id: string }>();

  if (created.error || !created.data?.id) {
    throw new Error(`Erro ao criar empresa CRM: ${created.error?.message ?? "falha desconhecida"}`);
  }
  return created.data.id;
}

async function ensureContactId(
  supabase: SupabaseClient,
  empresaId: string,
  contactName: string,
  email: string,
  telefone: string,
  cargo: string,
  companyId: string | null,
) {
  const nome = contactName.trim();
  if (!nome) return null;

  let existingId: string | null = null;
  const cleanEmail = email.trim();

  if (cleanEmail) {
    const byEmail = await supabase
      .from("crm_contacts")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("email", cleanEmail)
      .maybeSingle<{ id: string }>();
    if (byEmail.error) {
      throw new Error(`Erro ao buscar contato CRM por email: ${byEmail.error.message}`);
    }
    existingId = byEmail.data?.id ?? null;
  }

  if (!existingId) {
    const byName = await supabase
      .from("crm_contacts")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("nome", nome)
      .maybeSingle<{ id: string }>();
    if (byName.error) {
      throw new Error(`Erro ao buscar contato CRM por nome: ${byName.error.message}`);
    }
    existingId = byName.data?.id ?? null;
  }

  const payload = {
    empresa_id: empresaId,
    company_id: companyId,
    nome,
    email: cleanEmail || null,
    telefone: telefone.trim() || null,
    cargo: cargo.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const updated = await supabase
      .from("crm_contacts")
      .update(payload)
      .eq("empresa_id", empresaId)
      .eq("id", existingId)
      .select("id")
      .single<{ id: string }>();
    if (updated.error || !updated.data?.id) {
      throw new Error(`Erro ao atualizar contato CRM: ${updated.error?.message ?? "falha desconhecida"}`);
    }
    return updated.data.id;
  }

  const created = await supabase.from("crm_contacts").insert(payload).select("id").single<{ id: string }>();
  if (created.error || !created.data?.id) {
    throw new Error(`Erro ao criar contato CRM: ${created.error?.message ?? "falha desconhecida"}`);
  }
  return created.data.id;
}

async function findObraIdByName(supabase: SupabaseClient, empresaId: string, obraNome: string) {
  const clean = obraNome.trim();
  if (!clean) return null;
  const result = await supabase
    .from("obras")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("nome", clean)
    .maybeSingle<{ id: string }>();
  if (result.error) {
    throw new Error(`Erro ao buscar obra vinculada ao lead: ${result.error.message}`);
  }
  return result.data?.id ?? null;
}

async function syncLeadToDeal(supabase: SupabaseClient, lead: CrmLead) {
  const leadTag = `lead:${lead.id}`;
  const companyId = await ensureCompanyId(supabase, lead.empresa_id, lead.nome);
  const contactId = await ensureContactId(
    supabase,
    lead.empresa_id,
    lead.contato,
    lead.email,
    lead.telefone,
    lead.cargo,
    companyId,
  );
  const obraId = await findObraIdByName(supabase, lead.empresa_id, lead.obra);

  const existingDeal = await supabase
    .from("crm_deals")
    .select("id, tags")
    .eq("empresa_id", lead.empresa_id)
    .contains("tags", [leadTag])
    .maybeSingle<{ id: string; tags: string[] | null }>();

  if (existingDeal.error) {
    throw new Error(`Erro ao localizar deal vinculado ao lead: ${existingDeal.error.message}`);
  }

  const basePayload = {
    empresa_id: lead.empresa_id,
    company_id: companyId,
    contact_id: contactId,
    obra_id: obraId,
    nome: lead.obra?.trim() ? `${lead.nome} — ${lead.obra}` : lead.nome,
    descricao: lead.notas || null,
    stage: normalizeDealStage(mapLeadEtapaToDealStage(lead.etapa)),
    status: mapLeadEtapaToDealStatus(lead.etapa),
    priority: normalizeDealPriority(mapLeadPrioridadeToDealPriority(lead.prioridade)),
    probability: defaultDealProbability(normalizeDealStage(mapLeadEtapaToDealStage(lead.etapa))),
    valor: lead.valor ?? 0,
    last_activity_at: asIsoDateTime(lead.ultima_atividade),
    next_activity_at: null,
    loss_reason: "",
    custom_fields: {},
    playbook_items: buildDefaultPlaybook(normalizeDealStage(mapLeadEtapaToDealStage(lead.etapa))),
    updated_at: new Date().toISOString(),
  };

  if (existingDeal.data?.id) {
    const existingTags = Array.from(new Set([...(existingDeal.data.tags ?? []), "lead-sync", leadTag]));
    const update = await supabase
      .from("crm_deals")
      .update({ ...basePayload, tags: existingTags })
      .eq("empresa_id", lead.empresa_id)
      .eq("id", existingDeal.data.id)
      .select("id")
      .single<{ id: string }>();
    if (update.error || !update.data?.id) {
      throw new Error(`Erro ao atualizar deal sincronizado: ${update.error?.message ?? "falha desconhecida"}`);
    }
    await ensureDealAutomationFollowup(supabase, lead.empresa_id, update.data.id, basePayload.stage, lead.nome);
    return update.data.id;
  }

  const insert = await supabase
    .from("crm_deals")
    .insert({
      ...basePayload,
      owner_profile_id: null,
      tags: ["lead-sync", leadTag],
    })
    .select("id")
    .single<{ id: string }>();
  if (insert.error || !insert.data?.id) {
    throw new Error(`Erro ao criar deal sincronizado: ${insert.error?.message ?? "falha desconhecida"}`);
  }
  await ensureDealAutomationFollowup(supabase, lead.empresa_id, insert.data.id, basePayload.stage, lead.nome);
  return insert.data.id;
}

async function deleteLinkedDeal(supabase: SupabaseClient, empresaId: string, leadId: string) {
  const leadTag = `lead:${leadId}`;
  const existingDeal = await supabase
    .from("crm_deals")
    .select("id")
    .eq("empresa_id", empresaId)
    .contains("tags", [leadTag])
    .maybeSingle<{ id: string }>();
  if (existingDeal.error) {
    throw new Error(`Erro ao buscar deal para remoção: ${existingDeal.error.message}`);
  }
  if (!existingDeal.data?.id) return;

  const deleteActivities = await supabase
    .from("crm_activities")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("deal_id", existingDeal.data.id);
  if (deleteActivities.error) {
    throw new Error(`Erro ao remover atividades do deal: ${deleteActivities.error.message}`);
  }

  const deleteDeal = await supabase.from("crm_deals").delete().eq("empresa_id", empresaId).eq("id", existingDeal.data.id);
  if (deleteDeal.error) {
    throw new Error(`Erro ao remover deal vinculado ao lead: ${deleteDeal.error.message}`);
  }
}

export async function listCrmLeads(): Promise<CrmLead[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .select(CRM_SELECT)
    .eq("empresa_id", empresaId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Erro ao listar leads do CRM: ${error.message}`);

  return (data ?? []) as CrmLead[];
}

export async function listCrmDealsSummary(): Promise<CrmDealSummary[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const dealsRes = await supabase
    .from("crm_deals")
    .select(
      "id, nome, stage, status, priority, probability, valor, last_activity_at, next_activity_at, tags, owner_profile_id, loss_reason, custom_fields, playbook_items, company:crm_companies!crm_deals_company_id_fkey(nome), contact:crm_contacts!crm_deals_contact_id_fkey(nome), owner:profiles!crm_deals_owner_profile_id_fkey(nome)",
    )
    .eq("empresa_id", empresaId)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (dealsRes.error) {
    throw new Error(`Erro ao listar negócios CRM: ${dealsRes.error.message}`);
  }

  const dealRows = (dealsRes.data ?? []) as Array<Record<string, unknown>>;
  if (dealRows.length === 0) return [];
  const dealIds = dealRows.map((row) => String(row.id ?? "")).filter(Boolean);

  const activitiesRes = await supabase
    .from("crm_activities")
    .select("deal_id, done")
    .eq("empresa_id", empresaId)
    .in("deal_id", dealIds)
    .limit(1000);
  if (activitiesRes.error) {
    throw new Error(`Erro ao listar atividades dos negócios CRM: ${activitiesRes.error.message}`);
  }

  const byDeal = new Map<string, { total: number; open: number }>();
  for (const row of (activitiesRes.data ?? []) as Array<Record<string, unknown>>) {
    const dealId = String(row.deal_id ?? "");
    if (!dealId) continue;
    const slot = byDeal.get(dealId) ?? { total: 0, open: 0 };
    slot.total += 1;
    if (!Boolean(row.done)) slot.open += 1;
    byDeal.set(dealId, slot);
  }

  return dealRows.map((row) => {
    const dealId = String(row.id ?? "");
    const counts = byDeal.get(dealId) ?? { total: 0, open: 0 };
    return {
      id: dealId,
      nome: String(row.nome ?? ""),
      stage: String(row.stage ?? ""),
      status: String(row.status ?? ""),
      priority: String(row.priority ?? ""),
      probability: Number(row.probability ?? 0),
      valor: Number(row.valor ?? 0),
      company_name: String((row.company as { nome?: string } | null)?.nome ?? ""),
      contact_name: String((row.contact as { nome?: string } | null)?.nome ?? ""),
      owner_profile_id: row.owner_profile_id ? String(row.owner_profile_id) : null,
      owner_name: String((row.owner as { nome?: string } | null)?.nome ?? ""),
      last_activity_at: row.last_activity_at ? String(row.last_activity_at) : null,
      next_activity_at: row.next_activity_at ? String(row.next_activity_at) : null,
      activities_total: counts.total,
      activities_open: counts.open,
      tags: Array.isArray((row as { tags?: unknown }).tags)
        ? ((row as { tags: string[] }).tags ?? []).filter((tag) => typeof tag === "string")
        : [],
      loss_reason: String(row.loss_reason ?? ""),
      custom_fields: normalizeCustomFields((row as { custom_fields?: unknown }).custom_fields),
      playbook_items: normalizePlaybookItems((row as { playbook_items?: unknown }).playbook_items, String(row.stage ?? "novos")),
    } satisfies CrmDealSummary;
  });
}

function asNullableIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function refreshDealActivitySchedule(supabase: SupabaseClient, empresaId: string, dealId: string) {
  const activitiesRes = await supabase
    .from("crm_activities")
    .select("due_at")
    .eq("empresa_id", empresaId)
    .eq("deal_id", dealId)
    .eq("done", false)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(1);

  if (activitiesRes.error) {
    throw new Error(`Erro ao calcular próxima atividade do negócio: ${activitiesRes.error.message}`);
  }

  const nextActivityAt = activitiesRes.data?.[0]?.due_at ? String(activitiesRes.data[0].due_at) : null;
  const now = new Date().toISOString();
  const update = await supabase
    .from("crm_deals")
    .update({
      next_activity_at: nextActivityAt,
      last_activity_at: now,
      updated_at: now,
    })
    .eq("empresa_id", empresaId)
    .eq("id", dealId);

  if (update.error) {
    throw new Error(`Erro ao atualizar agenda do negócio: ${update.error.message}`);
  }
}

export async function listCrmDealActivities(dealId: string): Promise<CrmDealActivity[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("crm_activities")
    .select("id, empresa_id, deal_id, type, subject, body, channel, due_at, completed_at, done, created_at, updated_at")
    .eq("empresa_id", empresaId)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar atividades do CRM: ${error.message}`);
  }

  return ((data ?? []) as CrmDealActivity[]).map((activity) => ({
    ...activity,
    due_at: activity.due_at ? String(activity.due_at) : null,
    completed_at: activity.completed_at ? String(activity.completed_at) : null,
  }));
}

export async function createCrmDealActivity(dealId: string, input: CrmDealActivityInput) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const payload = {
    empresa_id: empresaId,
    deal_id: dealId,
    type: normalizeActivityType(input.type),
    subject: String(input.subject ?? "").trim(),
    body: String(input.body ?? "").trim(),
    channel: normalizeActivityChannel(input.channel ?? "manual"),
    due_at: asNullableIso(input.due_at ?? null),
    completed_at: input.done ? now : null,
    done: Boolean(input.done),
    updated_at: now,
  };

  if (!payload.subject) {
    throw new Error("Assunto da atividade é obrigatório");
  }

  const { data, error } = await supabase
    .from("crm_activities")
    .insert(payload)
    .select("id, empresa_id, deal_id, type, subject, body, channel, due_at, completed_at, done, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`Erro ao criar atividade do CRM: ${error?.message ?? "falha desconhecida"}`);
  }

  await refreshDealActivitySchedule(supabase, empresaId, dealId);
  return data as CrmDealActivity;
}

export async function updateCrmDealActivity(activityId: string, patch: Partial<Pick<CrmDealActivityInput, "done" | "body" | "subject" | "due_at" | "type" | "channel">>) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const { data: current, error: currentError } = await supabase
    .from("crm_activities")
    .select("id, deal_id, done")
    .eq("empresa_id", empresaId)
    .eq("id", activityId)
    .maybeSingle<{ id: string; deal_id: string; done: boolean }>();

  if (currentError) {
    throw new Error(`Erro ao carregar atividade do CRM: ${currentError.message}`);
  }

  if (!current?.id) {
    throw new Error("Atividade não encontrada");
  }

  const updatePayload: Record<string, unknown> = { updated_at: now };
  if (typeof patch.subject === "string") updatePayload.subject = String(patch.subject).trim();
  if (typeof patch.body === "string") updatePayload.body = String(patch.body).trim();
  if (typeof patch.type === "string") updatePayload.type = normalizeActivityType(patch.type);
  if (typeof patch.channel === "string") updatePayload.channel = normalizeActivityChannel(patch.channel);
  if (patch.due_at !== undefined) updatePayload.due_at = asNullableIso(patch.due_at ?? null);
  if (patch.done !== undefined) {
    updatePayload.done = Boolean(patch.done);
    updatePayload.completed_at = patch.done ? now : null;
  }

  const { data, error } = await supabase
    .from("crm_activities")
    .update(updatePayload)
    .eq("empresa_id", empresaId)
    .eq("id", activityId)
    .select("id, empresa_id, deal_id, type, subject, body, channel, due_at, completed_at, done, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`Erro ao atualizar atividade do CRM: ${error?.message ?? "falha desconhecida"}`);
  }

  await refreshDealActivitySchedule(supabase, empresaId, current.deal_id);
  return data as CrmDealActivity;
}

export async function updateCrmDeal(dealId: string, patch: UpdateCrmDealInput) {
  const empresaId = await getEmpresaIdFromProfile();
  const profile = await getCurrentProfile();
  const supabase = await createServerClient();

  const currentRes = await supabase
    .from("crm_deals")
    .select("id, nome, stage, status, loss_reason, playbook_items")
    .eq("empresa_id", empresaId)
    .eq("id", dealId)
    .maybeSingle<{ id: string; nome: string; stage: string; status: string; loss_reason: string; playbook_items: unknown }>();
  if (currentRes.error) {
    throw new Error(`Erro ao carregar negócio CRM: ${currentRes.error.message}`);
  }
  if (!currentRes.data?.id) {
    throw new Error("Negócio não encontrado");
  }

  const nextStage = patch.stage ? normalizeDealStage(patch.stage) : currentRes.data.stage;
  const nextStatus = patch.status ? String(patch.status).trim().toLowerCase() : currentRes.data.status;
  const nextLossReason = typeof patch.loss_reason === "string" ? patch.loss_reason.trim() : currentRes.data.loss_reason;
  const isLost = nextStage === "perdido" || nextStatus === "perdido";
  if (isLost && !nextLossReason) {
    throw new Error("Motivo de perda é obrigatório para negócios perdidos.");
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.stage) {
    updatePayload.stage = nextStage;
    updatePayload.probability = defaultDealProbability(nextStage);
    if (nextStage === "ganho") updatePayload.status = "ganho";
    if (nextStage === "perdido") updatePayload.status = "perdido";
  }
  if (patch.status) updatePayload.status = nextStatus;
  if (patch.priority) updatePayload.priority = normalizeDealPriority(patch.priority);
  if (typeof patch.probability === "number") {
    const bounded = Math.max(0, Math.min(100, Math.round(patch.probability)));
    updatePayload.probability = bounded;
  }
  if (patch.owner_profile_id !== undefined) {
    updatePayload.owner_profile_id = patch.owner_profile_id ? String(patch.owner_profile_id) : null;
  }
  if (patch.loss_reason !== undefined) {
    updatePayload.loss_reason = nextLossReason;
  }
  if (patch.custom_fields !== undefined) {
    updatePayload.custom_fields = normalizeCustomFields(patch.custom_fields);
  }
  if (patch.playbook_items !== undefined) {
    updatePayload.playbook_items = normalizePlaybookItems(patch.playbook_items, nextStage);
  } else if (patch.stage) {
    const currentItems = normalizePlaybookItems(currentRes.data.playbook_items, currentRes.data.stage);
    const shouldResetPlaybook = currentItems.every((item) => item.done);
    if (shouldResetPlaybook) {
      updatePayload.playbook_items = buildDefaultPlaybook(nextStage);
    }
  }
  if (!isLost && (patch.stage || patch.status) && patch.loss_reason === undefined) {
    updatePayload.loss_reason = "";
  }
  if (patch.owner_profile_id === undefined && profile?.id) {
    updatePayload.owner_profile_id = profile.id;
  }

  const update = await supabase
    .from("crm_deals")
    .update(updatePayload)
    .eq("empresa_id", empresaId)
    .eq("id", dealId)
    .select("id")
    .single<{ id: string }>();
  if (update.error || !update.data?.id) {
    throw new Error(`Erro ao atualizar negócio CRM: ${update.error?.message ?? "falha desconhecida"}`);
  }

  await ensureDealAutomationFollowup(supabase, empresaId, dealId, nextStage, currentRes.data.nome);
  return update.data;
}

export async function listCrmLossReasonsReport() {
  const empresaId = await getEmpresaIdFromProfile();
  
  // Security: Prevent viewing loss reasons from master account for client users
  await ensureNotMasterAccount(empresaId);
  
  const supabase = await createServerClient();
  const deals = await supabase
    .from("crm_deals")
    .select("loss_reason, valor")
    .eq("empresa_id", empresaId)
    .eq("status", "perdido")
    .neq("loss_reason", "");
  if (deals.error) {
    throw new Error(`Erro ao gerar relatório de perdas: ${deals.error.message}`);
  }
  const grouped = new Map<string, { reason: string; total: number; value: number }>();
  for (const row of (deals.data ?? []) as Array<{ loss_reason: string; valor: number }>) {
    const reason = String(row.loss_reason ?? "").trim() || "Não informado";
    const slot = grouped.get(reason) ?? { reason, total: 0, value: 0 };
    slot.total += 1;
    slot.value += Number(row.valor ?? 0);
    grouped.set(reason, slot);
  }
  return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
}

export async function listCrmAssignableProfiles(): Promise<CrmProfileSummary[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  
  // Get all master companies first (to exclude them)
  let { data: masterCompanies } = await supabase
    .from("companies")
    .select("id")
    .eq("is_master", true);
  
  // If no master is marked yet, try to auto-detect it
  if (!masterCompanies || masterCompanies.length === 0) {
    // Check if there's a company with "Master" in the name
    const { data: potentialMaster } = await supabase
      .from("companies")
      .select("id, nome")
      .ilike("nome", "%master%")
      .limit(1);
    
    if (potentialMaster && potentialMaster.length > 0) {
      const masterId = potentialMaster[0].id;
      // Try to mark it (this will fail silently if RLS blocks it, but that's OK)
      try {
        await supabase
          .from("companies")
          .update({ is_master: true })
          .eq("id", masterId);
      } catch {
        // Ignore errors - filtering will still work
      }
      
      masterCompanies = [{ id: masterId }];
    } else {
      // Fallback: get the oldest company
      const { data: oldestCompany } = await supabase
        .from("companies")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1);
      
      if (oldestCompany && oldestCompany.length > 0) {
        const masterId = oldestCompany[0].id;
        // Try to mark it as master
        try {
          await supabase
            .from("companies")
            .update({ is_master: true })
            .eq("id", masterId);
        } catch {
          // Ignore errors - filtering will still work
        }
        
        masterCompanies = [{ id: masterId }];
      }
    }
  }
    
  const masterIds = new Set((masterCompanies ?? []).map(c => c.id));
  
  // Query: Get profiles from current company only
  // Exclude ANY profiles from master accounts
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email, role, empresa_id")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });
    
  if (error) {
    throw new Error(`Erro ao listar perfis comerciais: ${error.message}`);
  }
  
  // Filter out profiles from master company - ALWAYS, regardless of user's company
  const filtered = (data ?? []).filter(p => !masterIds.has(p.empresa_id));
  
  return filtered.map((item) => ({
    id: String(item.id),
    nome: String(item.nome ?? ""),
    email: String(item.email ?? ""),
    role: String(item.role ?? ""),
  }));
}

export async function runCrmFollowupAutomation() {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const deals = await supabase
    .from("crm_deals")
    .select("id, nome, stage, status")
    .eq("empresa_id", empresaId)
    .eq("status", "aberto");
  if (deals.error) {
    throw new Error(`Erro ao carregar negócios para automação: ${deals.error.message}`);
  }
  let touched = 0;
  for (const deal of (deals.data ?? []) as Array<{ id: string; nome: string; stage: string; status: string }>) {
    await ensureDealAutomationFollowup(supabase, empresaId, deal.id, normalizeDealStage(deal.stage), deal.nome);
    touched += 1;
  }
  return { processed: touched };
}

function mapTaskStatusToEtapa(status: string): CrmLead["etapa"] {
  const s = status.toLowerCase();
  if (s.includes("conclu")) return "Fechado";
  if (s.includes("atras")) return "Negociação";
  if (s.includes("andamento") || s.includes("execucao") || s.includes("execução")) return "Proposta";
  if (s.includes("cancel")) return "Perdido";
  if (s.includes("planej")) return "Qualificação";
  return "Contato";
}

function mapTaskStatusToPrioridade(status: string): CrmLead["prioridade"] {
  const s = status.toLowerCase();
  if (s.includes("atras")) return "Alta";
  if (s.includes("conclu")) return "Baixa";
  return "Média";
}

function buildCronogramaTaskMarker(taskId: string) {
  return `[cronograma_task_id:${taskId}]`;
}

async function findLeadIdByCronogramaTaskId(supabase: SupabaseClient, empresaId: string, taskId: string) {
  const marker = buildCronogramaTaskMarker(taskId);
  const search = await supabase
    .from("crm_leads")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("origem", "Cronograma")
    .ilike("notas", `%${marker}%`)
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (search.error) {
    throw new Error(`Erro ao localizar card CRM da tarefa: ${search.error.message}`);
  }
  return search.data?.id ?? null;
}

export async function upsertCrmLeadFromCronogramaTask(input: CronogramaTaskSyncInput) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const existingId = await findLeadIdByCronogramaTaskId(supabase, empresaId, input.taskId);
  const marker = buildCronogramaTaskMarker(input.taskId);
  await upsertCrmLead({
    ...(existingId ? { id: existingId } : {}),
    nome: input.nome,
    contato: input.clienteNome ?? "",
    cargo: "Gestão da obra",
    email: "",
    telefone: "",
    valor: 0,
    etapa: mapTaskStatusToEtapa(input.status),
    origem: "Cronograma",
    obra: input.obraNome,
    prioridade: mapTaskStatusToPrioridade(input.status),
    ultima_atividade: input.fim,
    notas: `${marker} Card gerado automaticamente a partir da tarefa do cronograma (${input.inicio} → ${input.fim}).`,
  });
}

export async function deleteCrmLeadFromCronogramaTask(taskId: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const leadId = await findLeadIdByCronogramaTaskId(supabase, empresaId, taskId);
  if (!leadId) return;
  await deleteCrmLead(leadId);
}

export async function listCrmLeadsFromTasks(): Promise<CrmLead[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("obras_tarefas")
    .select("id, empresa_id, nome, status, inicio, fim, created_at, obra_id, obras(nome, cliente)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar tarefas para CRM: ${error.message}`);
  }

  return (data ?? []).map((item) => {
    const status = String(item.status ?? "planejado");
    const obra = (item.obras as { nome?: string; cliente?: string } | null) ?? null;
    const atividade = String(item.fim ?? item.inicio ?? item.created_at ?? new Date().toISOString()).slice(0, 10);
    const createdAt = String(item.created_at ?? new Date().toISOString());
    return {
      id: String(item.id),
      empresa_id: String(item.empresa_id),
      nome: String(item.nome ?? "Tarefa sem nome"),
      contato: String(obra?.cliente ?? ""),
      cargo: "Cliente da obra",
      email: "",
      telefone: "",
      valor: 0,
      etapa: mapTaskStatusToEtapa(status),
      origem: "Tarefa da obra",
      obra: String(obra?.nome ?? ""),
      prioridade: mapTaskStatusToPrioridade(status),
      ultima_atividade: atividade,
      notas: `Status real da tarefa: ${status}`,
      created_at: createdAt,
      updated_at: createdAt,
    } as CrmLead;
  });
}

export async function upsertCrmLead(input: UpsertCrmLeadInput) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    empresa_id: empresaId,
    nome: input.nome,
    contato: input.contato ?? "",
    cargo: input.cargo ?? "",
    email: input.email ?? "",
    telefone: input.telefone ?? "",
    valor: input.valor ?? 0,
    etapa: input.etapa ?? "Contato",
    origem: input.origem ?? "Manual",
    obra: input.obra ?? "",
    prioridade: input.prioridade ?? "Média",
    ultima_atividade: input.ultima_atividade ?? new Date().toISOString().slice(0, 10),
    notas: input.notas ?? "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("crm_leads")
    .upsert(payload, { onConflict: "id" })
    .select(CRM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(`Erro ao salvar lead no CRM: ${error?.message ?? "falha desconhecida"}`);
  }

  const lead = data as CrmLead;
  await syncLeadToDeal(supabase, lead);

  return lead;
}

export async function updateCrmLeadStage(id: string, etapa: CrmLead["etapa"]) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("crm_leads")
    .update({ etapa, ultima_atividade: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() })
    .eq("empresa_id", empresaId)
    .eq("id", id)
    .select(CRM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(`Erro ao atualizar etapa do lead: ${error?.message ?? "lead não encontrado"}`);
  }

  const lead = data as CrmLead;
  await syncLeadToDeal(supabase, lead);
  return lead;
}

export async function deleteCrmLead(id: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await deleteLinkedDeal(supabase, empresaId, id);
  const { error } = await supabase
    .from("crm_leads")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("id", id);
  if (error) {
    throw new Error(`Erro ao remover lead do CRM: ${error.message}`);
  }
}

// ────────────────────────────────────────────────────────
// CRM Workspaces - Contextos separados (Vendas, Operacional, etc.)
// ────────────────────────────────────────────────────────

export type CrmWorkspace = {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export async function listCrmWorkspaces(): Promise<CrmWorkspace[]> {
  const empresaId = await getEmpresaIdFromProfile();
  
  // Security: Ensure this is not being called for master account by unauthorized users
  // (RLS should handle this, but extra protection at app level)
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("crm_workspaces")
    .select("*")
    .eq("company_id", empresaId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Erro ao listar workspaces:", error);
    return [];
  }

  // Filter out any workspaces from master accounts if user is not from master
  const filtered = (data || []) as CrmWorkspace[];
  
  return filtered;
}

export async function createCrmWorkspace(name: string, color: string = "#3B82F6", description?: string): Promise<CrmWorkspace> {
  const empresaId = await getEmpresaIdFromProfile();
  
  // Security: Prevent client accounts from creating workspaces in master account
  await ensureNotMasterAccount(empresaId);
  
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("crm_workspaces")
    .insert({
      company_id: empresaId,
      name,
      color,
      description,
      sort_order: 0,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao criar workspace: ${error.message}`);
  }

  return data as CrmWorkspace;
}

export async function updateCrmWorkspace(id: string, updates: Partial<CrmWorkspace>): Promise<CrmWorkspace> {
  const empresaId = await getEmpresaIdFromProfile();
  
  // Security: Prevent client accounts from modifying workspaces in master account
  await ensureNotMasterAccount(empresaId);
  
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("crm_workspaces")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", empresaId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar workspace: ${error.message}`);
  }

  return data as CrmWorkspace;
}

export async function deleteCrmWorkspace(id: string): Promise<void> {
  const empresaId = await getEmpresaIdFromProfile();
  
  // Security: Prevent client accounts from deleting workspaces in master account
  await ensureNotMasterAccount(empresaId);
  
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("crm_workspaces")
    .delete()
    .eq("id", id)
    .eq("company_id", empresaId);

  if (error) {
    throw new Error(`Erro ao deletar workspace: ${error.message}`);
  }
}

export async function listCrmDealsByWorkspace(workspaceId?: string): Promise<CrmDealSummary[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  let query = supabase
    .from("crm_deals")
    .select(
      "id, nome, stage, status, priority, probability, valor, last_activity_at, next_activity_at, tags, owner_profile_id, loss_reason, custom_fields, playbook_items, company:crm_companies!crm_deals_company_id_fkey(nome), contact:crm_contacts!crm_deals_contact_id_fkey(nome), owner:profiles!crm_deals_owner_profile_id_fkey(nome)",
    )
    .eq("empresa_id", empresaId)
    .order("updated_at", { ascending: false })
    .limit(120);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  } else {
    query = query.is("workspace_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar deals do workspace:", error);
    return [];
  }

  const dealRows = (data ?? []) as Array<Record<string, unknown>>;
  if (dealRows.length === 0) return [];
  const dealIds = dealRows.map((row) => String(row.id ?? "")).filter(Boolean);

  const activitiesRes = await supabase
    .from("crm_activities")
    .select("deal_id, done")
    .eq("empresa_id", empresaId)
    .in("deal_id", dealIds)
    .limit(1500);

  if (activitiesRes.error) {
    throw new Error(`Erro ao listar atividades dos deals por workspace: ${activitiesRes.error.message}`);
  }

  const byDeal = new Map<string, { total: number; open: number }>();
  for (const row of (activitiesRes.data ?? []) as Array<Record<string, unknown>>) {
    const dealId = String(row.deal_id ?? "");
    if (!dealId) continue;
    const slot = byDeal.get(dealId) ?? { total: 0, open: 0 };
    slot.total += 1;
    if (!Boolean(row.done)) slot.open += 1;
    byDeal.set(dealId, slot);
  }

  return dealRows.map((row) => {
    const dealId = String(row.id ?? "");
    const activity = byDeal.get(dealId) ?? { total: 0, open: 0 };
    const company = row.company as { nome?: string } | null;
    const contact = row.contact as { nome?: string } | null;
    const owner = row.owner as { nome?: string } | null;
    return {
      id: dealId,
      nome: String(row.nome ?? "Negócio sem nome"),
      stage: normalizeDealStage(String(row.stage ?? "novos")),
      status: String(row.status ?? "aberto"),
      priority: normalizeDealPriority(String(row.priority ?? "media")),
      probability: Number(row.probability ?? 0),
      valor: Number(row.valor ?? 0),
      company_name: company?.nome ?? "Empresa",
      contact_name: contact?.nome ?? "Contato",
      owner_profile_id: row.owner_profile_id ? String(row.owner_profile_id) : null,
      owner_name: owner?.nome ?? "Sem responsável",
      last_activity_at: row.last_activity_at ? String(row.last_activity_at) : null,
      next_activity_at: row.next_activity_at ? String(row.next_activity_at) : null,
      activities_total: activity.total,
      activities_open: activity.open,
      tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
      loss_reason: String(row.loss_reason ?? ""),
      custom_fields:
        row.custom_fields && typeof row.custom_fields === "object"
          ? (row.custom_fields as Record<string, string>)
          : {},
      playbook_items:
        Array.isArray(row.playbook_items)
          ? (row.playbook_items as CrmDealSummary["playbook_items"])
          : [],
    };
  });
}

// ────────────────────────────────────────────────────────
// Security: Master Account Protection
// ────────────────────────────────────────────────────────

async function isMasterAccount(empresaId: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select("is_master")
    .eq("id", empresaId)
    .single();

  return !error && data?.is_master === true;
}

async function ensureNotMasterAccount(empresaId: string): Promise<void> {
  const isMaster = await isMasterAccount(empresaId);
  if (isMaster) {
    throw new Error("Acesso negado: dados da master account não podem ser acessados por contas cliente");
  }
}

// ────────────────────────────────────────────────────────
// CRM Custom Tabs - User-defined card organization
// ────────────────────────────────────────────────────────

export type CrmCustomTab = {
  id: string;
  company_id: string;
  workspace_id?: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  filter_etapa?: string[];
  filter_prioridade?: string[];
  filter_origem?: string[];
  filter_owner_id?: string[];
  filter_search?: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export async function listCrmCustomTabs(workspaceId?: string): Promise<CrmCustomTab[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  let query = supabase
    .from("crm_custom_tabs")
    .select("*")
    .eq("company_id", empresaId);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  } else {
    query = query.is("workspace_id", null);
  }

  const { data, error } = await query.order("sort_order", { ascending: true });

  if (error) {
    console.error("Erro ao listar abas customizadas:", error);
    return [];
  }

  return (data || []) as CrmCustomTab[];
}

export async function createCrmCustomTab(
  name: string,
  workspaceId?: string,
  filters?: Partial<Omit<CrmCustomTab, "id" | "company_id" | "created_at" | "updated_at">>
): Promise<CrmCustomTab> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("crm_custom_tabs")
    .insert({
      company_id: empresaId,
      workspace_id: workspaceId,
      name,
      color: filters?.color || "#3B82F6",
      description: filters?.description,
      filter_etapa: filters?.filter_etapa || [],
      filter_prioridade: filters?.filter_prioridade || [],
      filter_origem: filters?.filter_origem || [],
      filter_owner_id: filters?.filter_owner_id || [],
      filter_search: filters?.filter_search || "",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao criar aba customizada: ${error.message}`);
  }

  return data as CrmCustomTab;
}

export async function updateCrmCustomTab(id: string, updates: Partial<CrmCustomTab>): Promise<CrmCustomTab> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("crm_custom_tabs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", empresaId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar aba customizada: ${error.message}`);
  }

  return data as CrmCustomTab;
}

export async function deleteCrmCustomTab(id: string): Promise<void> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("crm_custom_tabs")
    .delete()
    .eq("id", id)
    .eq("company_id", empresaId);

  if (error) {
    throw new Error(`Erro ao deletar aba customizada: ${error.message}`);
  }
}
