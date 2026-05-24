import { createServerClient } from "@/lib/supabase/server";
import { requireClientProfileOrThrow } from "@/lib/auth/require-client-account";
import { listObras } from "@/lib/db/obras";

export const CRM_STAGES = ["novos", "qualificacao", "proposta", "negociacao", "fechado_ganho"] as const;
export type CrmStage = (typeof CRM_STAGES)[number];

export type CrmDeal = {
  id: string;
  nome: string;
  obra_id: string | null;
  obra_nome: string | null;
  empresa_nome: string | null;
  contato_nome: string | null;
  valor: number;
  stage: CrmStage;
  priority: "baixa" | "media" | "alta";
  owner_profile_id: string | null;
  owner_nome: string | null;
  next_activity_at: string | null;
  last_activity_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CrmContact = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  company_nome: string | null;
};

export type CrmCompany = {
  id: string;
  nome: string;
  segmento: string | null;
  cidade: string | null;
};

export type CrmActivity = {
  id: string;
  deal_id: string;
  deal_nome: string;
  tipo: string;
  descricao: string;
  due_at: string | null;
  done: boolean;
  actor_nome: string | null;
  created_at: string;
};

export type CrmBoard = {
  id: string;
  slug: string;
  label: string;
  created_at: string;
};

function normalizePriority(value: string | null | undefined): CrmDeal["priority"] {
  if (value === "alta" || value === "media" || value === "baixa") return value;
  return "media";
}

function normalizeStage(value: string | null | undefined): CrmStage {
  const stage = String(value ?? "").toLowerCase() as CrmStage;
  return CRM_STAGES.includes(stage) ? stage : "novos";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getCrmEmpresaId() {
  const profile = await requireClientProfileOrThrow();
  return profile.empresa_id;
}

function getBoardSlugFromTags(tags: string[]) {
  for (const tag of tags) {
    if (tag.startsWith("board:")) {
      return tag.slice("board:".length).trim().toLowerCase();
    }
  }
  return null;
}

export async function listCrmDeals(): Promise<CrmDeal[]> {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();

  const [dealsRes, profilesRes, companiesRes, contactsRes, obras] = await Promise.all([
    supabase
      .from("crm_deals")
      .select(
        "id, nome, obra_id, company_id, contact_id, valor, stage, priority, owner_profile_id, next_activity_at, last_activity_at, tags, created_at, updated_at",
      )
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nome").eq("empresa_id", empresaId),
    supabase.from("crm_companies").select("id, nome").eq("empresa_id", empresaId),
    supabase.from("crm_contacts").select("id, nome").eq("empresa_id", empresaId),
    listObras(),
  ]);

  if (dealsRes.error) {
    throw new Error(`Erro ao listar negócios do CRM: ${dealsRes.error.message}`);
  }
  if (profilesRes.error) {
    throw new Error(`Erro ao listar responsáveis do CRM: ${profilesRes.error.message}`);
  }
  if (companiesRes.error) {
    throw new Error(`Erro ao listar empresas do CRM: ${companiesRes.error.message}`);
  }
  if (contactsRes.error) {
    throw new Error(`Erro ao listar contatos do CRM: ${contactsRes.error.message}`);
  }

  const profileMap = new Map<string, string>();
  for (const profile of profilesRes.data ?? []) {
    profileMap.set(String(profile.id), String(profile.nome ?? "Sem nome"));
  }
  const companyMap = new Map<string, string>();
  for (const company of companiesRes.data ?? []) {
    companyMap.set(String(company.id), String(company.nome ?? "Sem empresa"));
  }
  const contactMap = new Map<string, string>();
  for (const contact of contactsRes.data ?? []) {
    contactMap.set(String(contact.id), String(contact.nome ?? "Sem contato"));
  }
  const obraMap = new Map<string, string>();
  for (const obra of obras) {
    obraMap.set(String(obra.id), String(obra.nome ?? "Obra"));
  }

  return (dealsRes.data ?? []).map((deal) => ({
    id: String(deal.id),
    nome: String(deal.nome),
    obra_id: deal.obra_id ? String(deal.obra_id) : null,
    obra_nome: deal.obra_id ? obraMap.get(String(deal.obra_id)) ?? null : null,
    empresa_nome: deal.company_id ? companyMap.get(String(deal.company_id)) ?? null : null,
    contato_nome: deal.contact_id ? contactMap.get(String(deal.contact_id)) ?? null : null,
    valor: Number(deal.valor ?? 0),
    stage: normalizeStage(deal.stage ? String(deal.stage) : null),
    priority: normalizePriority(deal.priority ? String(deal.priority) : null),
    owner_profile_id: deal.owner_profile_id ? String(deal.owner_profile_id) : null,
    owner_nome: deal.owner_profile_id ? profileMap.get(String(deal.owner_profile_id)) ?? null : null,
    next_activity_at: deal.next_activity_at ? String(deal.next_activity_at) : null,
    last_activity_at: deal.last_activity_at ? String(deal.last_activity_at) : null,
    tags: Array.isArray(deal.tags) ? (deal.tags as string[]) : [],
    created_at: String(deal.created_at),
    updated_at: String(deal.updated_at),
  }));
}

export async function listCrmContacts(): Promise<CrmContact[]> {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();

  const [contactsRes, companiesRes] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("id, nome, email, telefone, cargo, company_id")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false }),
    supabase.from("crm_companies").select("id, nome").eq("empresa_id", empresaId),
  ]);

  if (contactsRes.error) {
    throw new Error(`Erro ao listar contatos do CRM: ${contactsRes.error.message}`);
  }
  if (companiesRes.error) {
    throw new Error(`Erro ao listar empresas dos contatos CRM: ${companiesRes.error.message}`);
  }

  const companyMap = new Map<string, string>();
  for (const company of companiesRes.data ?? []) {
    companyMap.set(String(company.id), String(company.nome ?? "Sem empresa"));
  }

  return (contactsRes.data ?? []).map((contact) => ({
    id: String(contact.id),
    nome: String(contact.nome),
    email: contact.email ? String(contact.email) : null,
    telefone: contact.telefone ? String(contact.telefone) : null,
    cargo: contact.cargo ? String(contact.cargo) : null,
    company_nome: contact.company_id ? companyMap.get(String(contact.company_id)) ?? null : null,
  }));
}

export async function listCrmCompanies(): Promise<CrmCompany[]> {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("crm_companies")
    .select("id, nome, segmento, cidade")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar empresas do CRM: ${error.message}`);
  }

  return (data ?? []).map((company) => ({
    id: String(company.id),
    nome: String(company.nome),
    segmento: company.segmento ? String(company.segmento) : null,
    cidade: company.cidade ? String(company.cidade) : null,
  }));
}

export async function listCrmActivities(limit = 60): Promise<CrmActivity[]> {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();

  const [activitiesRes, dealsRes, profilesRes] = await Promise.all([
    supabase
      .from("crm_activities")
      .select("id, deal_id, actor_profile_id, tipo, descricao, due_at, done, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("crm_deals").select("id, nome").eq("empresa_id", empresaId),
    supabase.from("profiles").select("id, nome").eq("empresa_id", empresaId),
  ]);

  if (activitiesRes.error) {
    throw new Error(`Erro ao listar atividades do CRM: ${activitiesRes.error.message}`);
  }
  if (dealsRes.error) {
    throw new Error(`Erro ao listar negócios para atividades CRM: ${dealsRes.error.message}`);
  }
  if (profilesRes.error) {
    throw new Error(`Erro ao listar usuários para atividades CRM: ${profilesRes.error.message}`);
  }

  const dealMap = new Map<string, string>();
  for (const deal of dealsRes.data ?? []) {
    dealMap.set(String(deal.id), String(deal.nome ?? "Negócio"));
  }

  const actorMap = new Map<string, string>();
  for (const profile of profilesRes.data ?? []) {
    actorMap.set(String(profile.id), String(profile.nome ?? "Usuário"));
  }

  return (activitiesRes.data ?? []).map((activity) => ({
    id: String(activity.id),
    deal_id: String(activity.deal_id),
    deal_nome: dealMap.get(String(activity.deal_id)) ?? "Negócio",
    tipo: String(activity.tipo),
    descricao: String(activity.descricao),
    due_at: activity.due_at ? String(activity.due_at) : null,
    done: Boolean(activity.done),
    actor_nome: activity.actor_profile_id ? actorMap.get(String(activity.actor_profile_id)) ?? null : null,
    created_at: String(activity.created_at),
  }));
}

export async function createCrmDeal(input: {
  nome: string;
  valor: number;
  stage: CrmStage;
  priority: "baixa" | "media" | "alta";
  owner_profile_id: string | null;
  obra_id: string | null;
  tags: string[];
}) {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();

  if (input.obra_id) {
    const obraCheck = await supabase
      .from("obras")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("id", input.obra_id)
      .maybeSingle();
    if (obraCheck.error) {
      throw new Error(`Erro ao validar obra do CRM: ${obraCheck.error.message}`);
    }
    if (!obraCheck.data?.id) {
      throw new Error("Obra inválida para a empresa atual");
    }
  }

  const boardSlug = getBoardSlugFromTags(input.tags);
  if (boardSlug && boardSlug !== "geral") {
    const boardCheck = await supabase
      .from("crm_boards")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("slug", boardSlug)
      .maybeSingle();
    if (boardCheck.error) {
      throw new Error(`Erro ao validar quadro do CRM: ${boardCheck.error.message}`);
    }
    if (!boardCheck.data?.id) {
      throw new Error("Quadro CRM inválido para a empresa atual");
    }
  }

  const { error } = await supabase.from("crm_deals").insert({
    empresa_id: empresaId,
    nome: input.nome,
    valor: input.valor,
    stage: input.stage,
    priority: input.priority,
    owner_profile_id: input.owner_profile_id,
    obra_id: input.obra_id,
    tags: input.tags,
  });

  if (error) {
    throw new Error(`Erro ao criar negócio CRM: ${error.message}`);
  }
}

export async function createCrmActivity(input: {
  deal_id: string;
  tipo: string;
  descricao: string;
  due_at: string | null;
}) {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();

  const dealCheck = await supabase
    .from("crm_deals")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("id", input.deal_id)
    .maybeSingle();
  if (dealCheck.error) {
    throw new Error(`Erro ao validar negócio da atividade CRM: ${dealCheck.error.message}`);
  }
  if (!dealCheck.data?.id) {
    throw new Error("Negócio inválido para a empresa atual");
  }

  const { error } = await supabase.from("crm_activities").insert({
    empresa_id: empresaId,
    deal_id: input.deal_id,
    tipo: input.tipo,
    descricao: input.descricao,
    due_at: input.due_at,
  });

  if (error) {
    throw new Error(`Erro ao criar atividade CRM: ${error.message}`);
  }
}

export async function updateCrmDealStage(input: { dealId: string; stage: CrmStage }) {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("crm_deals")
    .update({
      stage: input.stage,
      last_activity_at: new Date().toISOString(),
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.dealId);

  if (error) {
    throw new Error(`Erro ao mover negócio no CRM: ${error.message}`);
  }
}

export async function listCrmBoards(): Promise<CrmBoard[]> {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("crm_boards")
    .select("id, slug, label, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar quadros CRM: ${error.message}`);
  }

  const boards = (data ?? []).map((board) => ({
    id: String(board.id),
    slug: String(board.slug),
    label: String(board.label),
    created_at: String(board.created_at),
  }));

  if (!boards.some((board) => board.slug === "geral")) {
    return [{ id: "virtual-geral", slug: "geral", label: "Geral", created_at: new Date(0).toISOString() }, ...boards];
  }
  return boards;
}

export async function createCrmBoard(input: { label: string }) {
  const empresaId = await getCrmEmpresaId();
  const supabase = await createServerClient();
  const label = input.label.trim();
  const slug = slugify(label);

  if (!label || !slug) {
    throw new Error("Nome do quadro inválido");
  }
  if (slug === "geral") {
    throw new Error("O quadro Geral já existe");
  }

  const existing = await supabase
    .from("crm_boards")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing.error) {
    throw new Error(`Erro ao validar quadro CRM: ${existing.error.message}`);
  }
  if (existing.data?.id) {
    return;
  }

  const { error } = await supabase.from("crm_boards").insert({
    empresa_id: empresaId,
    slug,
    label,
  });

  if (error) {
    throw new Error(`Erro ao criar quadro CRM: ${error.message}`);
  }
}
