import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
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
  company_name: string;
  contact_name: string;
  last_activity_at: string | null;
  next_activity_at: string | null;
  activities_total: number;
  activities_open: number;
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

function asIsoDateTime(dateOrIso: string) {
  const maybe = new Date(dateOrIso);
  if (!Number.isFinite(maybe.getTime())) {
    return new Date().toISOString();
  }
  return maybe.toISOString();
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
    stage: mapLeadEtapaToDealStage(lead.etapa),
    status: mapLeadEtapaToDealStatus(lead.etapa),
    priority: mapLeadPrioridadeToDealPriority(lead.prioridade),
    valor: lead.valor ?? 0,
    last_activity_at: asIsoDateTime(lead.ultima_atividade),
    next_activity_at: null,
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
      "id, nome, stage, status, priority, valor, last_activity_at, next_activity_at, company:crm_companies!crm_deals_company_id_fkey(nome), contact:crm_contacts!crm_deals_contact_id_fkey(nome)",
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
      valor: Number(row.valor ?? 0),
      company_name: String((row.company as { nome?: string } | null)?.nome ?? ""),
      contact_name: String((row.contact as { nome?: string } | null)?.nome ?? ""),
      last_activity_at: row.last_activity_at ? String(row.last_activity_at) : null,
      next_activity_at: row.next_activity_at ? String(row.next_activity_at) : null,
      activities_total: counts.total,
      activities_open: counts.open,
    } satisfies CrmDealSummary;
  });
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
