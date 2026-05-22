import { getCurrentUser } from "@/lib/auth/session";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { decryptField, encryptField } from "@/lib/security/aes256";
import { createServerClient } from "@/lib/supabase/server";

export type QualidadeFiltro = {
  obraId?: string;
  status?: string;
  severidade?: string;
  responsavelId?: string;
  from?: string;
  to?: string;
};

export type QualidadeResponsavel = {
  id: string;
  nome: string;
  cargo: string | null;
};

export type NaoConformidadeItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  categoria: string;
  descricao: string;
  severidade: string;
  status: string;
  prazo: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  resolucao: string;
  created_at: string;
  resolvido_em: string | null;
  fechado_em: string | null;
  reaberturas: number;
};

export type PlanoAcaoItem = {
  id: string;
  nao_conformidade_id: string;
  titulo: string;
  descricao: string;
  prazo: string | null;
  status: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  concluido_em: string | null;
  created_at: string;
};

export type EvidenciaItem = {
  id: string;
  nao_conformidade_id: string;
  url: string;
  descricao: string;
  created_by: string | null;
  created_by_nome: string | null;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  norma: string;
  item: string;
  status: string;
  conforme: boolean;
  observacao: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  inspecionado_em: string | null;
  created_at: string;
};

export type QualidadeKpis = {
  totalNc: number;
  abertas: number;
  atrasadas: number;
  criticas: number;
  resolvidasNoPrazo: number;
  mttrDias: number;
  taxaReincidencia: number;
};

function normalizeDateStart(value?: string) {
  const parsed = String(value ?? "").trim();
  return parsed || null;
}

function normalizeDateEnd(value?: string) {
  const parsed = String(value ?? "").trim();
  return parsed || null;
}

function isMissingSchemaResource(message: string, resources: string[]) {
  const text = message.toLowerCase();
  if (!text.includes("does not exist")) return false;
  return resources.some((resource) => text.includes(resource.toLowerCase()));
}

async function listProfilesByEmpresa(empresaId: string): Promise<QualidadeResponsavel[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, cargo")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar responsaveis de qualidade: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: item.id as string,
    nome: (item.nome as string) ?? "Usuário",
    cargo: (item.cargo as string | null) ?? null,
  }));
}

async function listProfileNameMap(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome")
    .in("id", ids);

  if (error) {
    throw new Error(`Erro ao carregar nomes dos responsaveis: ${error.message}`);
  }

  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    map[item.id as string] = (item.nome as string) ?? "Usuário";
  }
  return map;
}

async function notifyEmpresaQuality(empresaId: string, title: string, link = "/qualidade") {
  const supabase = await createServerClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("empresa_id", empresaId);

  if (profileError) {
    throw new Error(`Erro ao buscar perfis para notificacao de qualidade: ${profileError.message}`);
  }

  const rows = (profiles ?? []).map((profile) => ({
    empresa_id: empresaId,
    user_id: profile.id,
    titulo: title,
    link,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from("notificacoes").insert(rows);
  if (error) {
    throw new Error(`Erro ao emitir notificacao de qualidade: ${error.message}`);
  }
}

export async function listQualidadeResponsaveis(): Promise<QualidadeResponsavel[]> {
  const empresaId = await getEmpresaIdFromProfile();
  return listProfilesByEmpresa(empresaId);
}

export async function listNaoConformidades(filters: QualidadeFiltro = {}): Promise<NaoConformidadeItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const from = normalizeDateStart(filters.from);
  const to = normalizeDateEnd(filters.to);

  let query = supabase
    .from("nao_conformidades")
    .select(
      "id, obra_id, categoria, descricao, severidade, status, prazo, responsavel_id, resolucao, created_at, resolvido_em, fechado_em, reaberturas, obras(nome)",
    )
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (filters.obraId) query = query.eq("obra_id", filters.obraId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.severidade) query = query.eq("severidade", filters.severidade);
  if (filters.responsavelId) query = query.eq("responsavel_id", filters.responsavelId);
  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  let { data, error } = await query;
  let rows: Array<Record<string, unknown>> = (data ?? []) as Array<Record<string, unknown>>;
  if (error && isMissingSchemaResource(error.message, ["resolvido_em", "fechado_em", "reaberturas"])) {
    let legacyQuery = supabase
      .from("nao_conformidades")
      .select("id, obra_id, categoria, descricao, severidade, status, prazo, responsavel_id, resolucao, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    if (filters.obraId) legacyQuery = legacyQuery.eq("obra_id", filters.obraId);
    if (filters.status) legacyQuery = legacyQuery.eq("status", filters.status);
    if (filters.severidade) legacyQuery = legacyQuery.eq("severidade", filters.severidade);
    if (filters.responsavelId) legacyQuery = legacyQuery.eq("responsavel_id", filters.responsavelId);
    if (from) legacyQuery = legacyQuery.gte("created_at", `${from}T00:00:00`);
    if (to) legacyQuery = legacyQuery.lte("created_at", `${to}T23:59:59`);
    const legacy = await legacyQuery;
    rows = (legacy.data ?? []) as Array<Record<string, unknown>>;
    error = legacy.error;
  } else {
    rows = (data ?? []) as Array<Record<string, unknown>>;
  }
  if (error) {
    throw new Error(`Erro ao listar não conformidades: ${error.message}`);
  }

  const responsavelIds = Array.from(
    new Set(rows.map((item) => item.responsavel_id).filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
  const profileMap = await listProfileNameMap(responsavelIds);

  return rows
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
    categoria: item.categoria as string,
    descricao: decryptField(item.descricao as string) ?? "",
    severidade: (item.severidade as string) ?? "media",
    status: (item.status as string) ?? "aberta",
    prazo: (item.prazo as string | null) ?? null,
    responsavel_id: (item.responsavel_id as string | null) ?? null,
    responsavel_nome: profileMap[(item.responsavel_id as string | null) ?? ""] ?? null,
    resolucao: decryptField(item.resolucao as string | null) ?? "",
    created_at: item.created_at as string,
    resolvido_em: (item.resolvido_em as string | null) ?? null,
    fechado_em: (item.fechado_em as string | null) ?? null,
    reaberturas: Number(item.reaberturas ?? 0),
  }));
}

export async function createNaoConformidade(input: {
  obra_id: string;
  categoria: string;
  descricao: string;
  severidade?: string;
  prazo?: string;
  responsavel_id?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const severidade = input.severidade ?? "media";

  const { data, error } = await supabase
    .from("nao_conformidades")
    .insert({
      empresa_id: empresaId,
      obra_id: input.obra_id,
      categoria: input.categoria,
      descricao: encryptField(input.descricao) ?? "",
      severidade,
      prazo: input.prazo || null,
      responsavel_id: input.responsavel_id || null,
      status: "aberta",
    })
    .select("id, prazo")
    .single();

  if (error) {
    throw new Error(`Erro ao criar não conformidade: ${error.message}`);
  }

  if (severidade === "alta") {
    await notifyEmpresaQuality(empresaId, "NC crítica registrada: ação imediata necessária.");
  }

  const prazo = (data?.prazo as string | null) ?? null;
  if (prazo && prazo < new Date().toISOString().slice(0, 10)) {
    await notifyEmpresaQuality(empresaId, "NC criada já vencida no prazo.");
  }
}

export async function updateNaoConformidade(input: {
  id: string;
  status?: string;
  severidade?: string;
  prazo?: string;
  responsavel_id?: string;
  resolucao?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const status = (input.status ?? "").trim();
  const payload: Record<string, unknown> = {
    severidade: input.severidade || undefined,
    prazo: input.prazo || null,
    responsavel_id: input.responsavel_id || null,
    resolucao: encryptField(input.resolucao ?? "") ?? "",
  };

  if (status) {
    payload.status = status;
    if (status === "resolvida") payload.resolvido_em = new Date().toISOString();
    if (status === "fechada") payload.fechado_em = new Date().toISOString();
  }

  let { data: current, error: currentError } = await supabase
    .from("nao_conformidades")
    .select("status, reaberturas, prazo")
    .eq("empresa_id", empresaId)
    .eq("id", input.id)
    .single();

  if (currentError) {
    if (isMissingSchemaResource(currentError.message, ["reaberturas"])) {
      const legacyCurrent = await supabase
        .from("nao_conformidades")
        .select("status, prazo")
        .eq("empresa_id", empresaId)
        .eq("id", input.id)
        .single();
      current = legacyCurrent.data as typeof current;
      currentError = legacyCurrent.error;
    }
    if (currentError) {
      throw new Error(`Erro ao carregar não conformidade para atualizacao: ${currentError.message}`);
    }
  }

  if (status === "reaberta") {
    payload.reaberturas = Number((current as { reaberturas?: unknown } | null)?.reaberturas ?? 0) + 1;
  }

  const { error } = await supabase
    .from("nao_conformidades")
    .update(payload)
    .eq("empresa_id", empresaId)
    .eq("id", input.id);

  if (error) {
    throw new Error(`Erro ao atualizar não conformidade: ${error.message}`);
  }

  const prazo = (input.prazo || ((current as { prazo?: string | null } | null)?.prazo ?? "") || "").trim();
  const aberto = !status || ["aberta", "em_tratamento", "reaberta"].includes(status);
  if (aberto && prazo && prazo < new Date().toISOString().slice(0, 10)) {
    await notifyEmpresaQuality(empresaId, "NC com prazo vencido exige ação.");
  }
}

export async function createPlanoAcao(input: {
  nao_conformidade_id: string;
  titulo: string;
  descricao?: string;
  prazo?: string;
  responsavel_id?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("qualidade_planos_acao").insert({
    empresa_id: empresaId,
    nao_conformidade_id: input.nao_conformidade_id,
    titulo: input.titulo,
    descricao: encryptField(input.descricao ?? "") ?? "",
    prazo: input.prazo || null,
    responsavel_id: input.responsavel_id || null,
    status: "pendente",
  });

  if (error) {
    if (isMissingSchemaResource(error.message, ["qualidade_planos_acao"])) {
      throw new Error("Plano de ação indisponível: aplique a migration 0013 no banco.");
    }
    throw new Error(`Erro ao criar plano de acao: ${error.message}`);
  }
}

export async function updatePlanoAcaoStatus(input: {
  id: string;
  status: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const status = input.status.trim();
  const { error } = await supabase
    .from("qualidade_planos_acao")
    .update({
      status,
      concluido_em: status === "concluido" ? new Date().toISOString() : null,
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.id);

  if (error) {
    if (isMissingSchemaResource(error.message, ["qualidade_planos_acao"])) {
      throw new Error("Plano de ação indisponível: aplique a migration 0013 no banco.");
    }
    throw new Error(`Erro ao atualizar status do plano de acao: ${error.message}`);
  }
}

export async function listPlanosAcao(ncIds?: string[]): Promise<PlanoAcaoItem[]> {
  if (ncIds && ncIds.length === 0) return [];
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  let query = supabase
    .from("qualidade_planos_acao")
    .select("id, nao_conformidade_id, titulo, descricao, prazo, status, responsavel_id, concluido_em, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (ncIds && ncIds.length > 0) {
    query = query.in("nao_conformidade_id", ncIds);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingSchemaResource(error.message, ["qualidade_planos_acao"])) {
      return [];
    }
    throw new Error(`Erro ao listar planos de acao: ${error.message}`);
  }

  const responsavelIds = Array.from(
    new Set((data ?? []).map((item) => item.responsavel_id).filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
  const profileMap = await listProfileNameMap(responsavelIds);

  return (data ?? []).map((item) => ({
    id: item.id as string,
    nao_conformidade_id: item.nao_conformidade_id as string,
    titulo: item.titulo as string,
    descricao: decryptField(item.descricao as string | null) ?? "",
    prazo: (item.prazo as string | null) ?? null,
    status: item.status as string,
    responsavel_id: (item.responsavel_id as string | null) ?? null,
    responsavel_nome: profileMap[(item.responsavel_id as string | null) ?? ""] ?? null,
    concluido_em: (item.concluido_em as string | null) ?? null,
    created_at: item.created_at as string,
  }));
}

export async function createEvidencia(input: {
  nao_conformidade_id: string;
  url: string;
  descricao?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const user = await getCurrentUser();
  const supabase = await createServerClient();

  if (!user) {
    throw new Error("Usuário não autenticado para registrar evidencia");
  }

  const { error } = await supabase.from("qualidade_evidencias").insert({
    empresa_id: empresaId,
    nao_conformidade_id: input.nao_conformidade_id,
    url: input.url,
    descricao: encryptField(input.descricao ?? "") ?? "",
    created_by: user.id,
  });

  if (error) {
    if (isMissingSchemaResource(error.message, ["qualidade_evidencias"])) {
      throw new Error("Evidências indisponíveis: aplique a migration 0013 no banco.");
    }
    throw new Error(`Erro ao criar evidencia de qualidade: ${error.message}`);
  }
}

export async function listEvidencias(ncIds?: string[]): Promise<EvidenciaItem[]> {
  if (ncIds && ncIds.length === 0) return [];
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  let query = supabase
    .from("qualidade_evidencias")
    .select("id, nao_conformidade_id, url, descricao, created_by, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (ncIds && ncIds.length > 0) {
    query = query.in("nao_conformidade_id", ncIds);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingSchemaResource(error.message, ["qualidade_evidencias"])) {
      return [];
    }
    throw new Error(`Erro ao listar evidencias de qualidade: ${error.message}`);
  }

  const createdByIds = Array.from(
    new Set((data ?? []).map((item) => item.created_by).filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
  const profileMap = await listProfileNameMap(createdByIds);

  return (data ?? []).map((item) => ({
    id: item.id as string,
    nao_conformidade_id: item.nao_conformidade_id as string,
    url: item.url as string,
    descricao: decryptField(item.descricao as string | null) ?? "",
    created_by: (item.created_by as string | null) ?? null,
    created_by_nome: profileMap[(item.created_by as string | null) ?? ""] ?? null,
    created_at: item.created_at as string,
  }));
}

export async function createChecklistItem(input: {
  obra_id: string;
  norma: string;
  item: string;
  status?: string;
  observacao?: string;
  responsavel_id?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const status = input.status?.trim() || "pendente";
  const conforme = status === "conforme";

  let { error } = await supabase.from("qualidade_checklists").insert({
    empresa_id: empresaId,
    obra_id: input.obra_id,
    norma: input.norma,
    item: input.item,
    status,
    conforme,
    observacao: encryptField(input.observacao ?? "") ?? "",
    responsavel_id: input.responsavel_id || null,
    inspecionado_em: status === "pendente" ? null : new Date().toISOString(),
  });

  if (error && isMissingSchemaResource(error.message, ["qualidade_checklists.status", "responsavel_id", "inspecionado_em"])) {
    const legacy = await supabase.from("qualidade_checklists").insert({
      empresa_id: empresaId,
      obra_id: input.obra_id,
      norma: input.norma,
      item: input.item,
      conforme,
      observacao: encryptField(input.observacao ?? "") ?? "",
    });
    error = legacy.error;
  }

  if (error) {
    throw new Error(`Erro ao criar checklist: ${error.message}`);
  }
}

export async function updateChecklistStatus(input: {
  id: string;
  status: string;
  observacao?: string;
  responsavel_id?: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const status = input.status.trim();
  let { error } = await supabase
    .from("qualidade_checklists")
    .update({
      status,
      conforme: status === "conforme",
      observacao: encryptField(input.observacao ?? "") ?? "",
      responsavel_id: input.responsavel_id || null,
      inspecionado_em: status === "pendente" ? null : new Date().toISOString(),
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.id);

  if (error && isMissingSchemaResource(error.message, ["qualidade_checklists.status", "responsavel_id", "inspecionado_em"])) {
    const legacy = await supabase
      .from("qualidade_checklists")
      .update({
        conforme: status === "conforme",
        observacao: encryptField(input.observacao ?? "") ?? "",
      })
      .eq("empresa_id", empresaId)
      .eq("id", input.id);
    error = legacy.error;
  }

  if (error) {
    throw new Error(`Erro ao atualizar checklist: ${error.message}`);
  }
}

export async function listChecklistItems(filters: QualidadeFiltro = {}): Promise<ChecklistItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const from = normalizeDateStart(filters.from);
  const to = normalizeDateEnd(filters.to);
  let query = supabase
    .from("qualidade_checklists")
    .select("id, obra_id, norma, item, status, conforme, observacao, responsavel_id, inspecionado_em, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (filters.obraId) query = query.eq("obra_id", filters.obraId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.responsavelId) query = query.eq("responsavel_id", filters.responsavelId);
  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  let { data, error } = await query;
  let rows: Array<Record<string, unknown>> = (data ?? []) as Array<Record<string, unknown>>;
  let legacyMode = false;
  if (error && isMissingSchemaResource(error.message, ["qualidade_checklists.status", "responsavel_id", "inspecionado_em"])) {
    legacyMode = true;
    let legacyQuery = supabase
      .from("qualidade_checklists")
      .select("id, obra_id, norma, item, conforme, observacao, created_at, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    if (filters.obraId) legacyQuery = legacyQuery.eq("obra_id", filters.obraId);
    if (from) legacyQuery = legacyQuery.gte("created_at", `${from}T00:00:00`);
    if (to) legacyQuery = legacyQuery.lte("created_at", `${to}T23:59:59`);
    const legacy = await legacyQuery;
    rows = (legacy.data ?? []) as Array<Record<string, unknown>>;
    error = legacy.error;
  } else {
    rows = (data ?? []) as Array<Record<string, unknown>>;
  }
  if (error) {
    throw new Error(`Erro ao listar checklist: ${error.message}`);
  }

  const responsavelIds = Array.from(
    new Set(
      rows
        .map((item) => ("responsavel_id" in item ? item.responsavel_id : null))
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );
  const profileMap = await listProfileNameMap(responsavelIds);

  const mapped = rows
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
    norma: item.norma as string,
    item: item.item as string,
    status: legacyMode ? (item.conforme ? "conforme" : "pendente") : ((item.status as string) ?? "pendente"),
    conforme: Boolean(item.conforme),
    observacao: decryptField(item.observacao as string | null) ?? "",
    responsavel_id: legacyMode ? null : ((item.responsavel_id as string | null) ?? null),
    responsavel_nome: legacyMode ? null : (profileMap[(item.responsavel_id as string | null) ?? ""] ?? null),
    inspecionado_em: legacyMode ? null : ((item.inspecionado_em as string | null) ?? null),
    created_at: item.created_at as string,
  }));

  return mapped.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.responsavelId && item.responsavel_id !== filters.responsavelId) return false;
    return true;
  });
}

export function buildQualidadeKpis(ncRows: NaoConformidadeItem[]): QualidadeKpis {
  const abertas = ncRows.filter((nc) => ["aberta", "em_tratamento", "reaberta"].includes(nc.status)).length;
  const hoje = new Date().toISOString().slice(0, 10);
  const atrasadas = ncRows.filter(
    (nc) =>
      !!nc.prazo &&
      nc.prazo < hoje &&
      ["aberta", "em_tratamento", "reaberta"].includes(nc.status),
  ).length;
  const criticas = ncRows.filter((nc) => nc.severidade === "alta").length;
  const resolvidasNoPrazo = ncRows.filter(
    (nc) => !!nc.prazo && !!nc.fechado_em && nc.fechado_em.slice(0, 10) <= nc.prazo,
  ).length;

  const concluido = ncRows.filter((nc) => !!nc.fechado_em);
  const mttrDias = concluido.length
    ? Number(
        (
          concluido.reduce((acc, nc) => {
            const start = new Date(nc.created_at).getTime();
            const end = new Date(nc.fechado_em!).getTime();
            const diffDays = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
            return acc + diffDays;
          }, 0) / concluido.length
        ).toFixed(1),
      )
    : 0;

  const reincidentes = ncRows.filter((nc) => nc.reaberturas > 0).length;
  const taxaReincidencia = ncRows.length ? Number(((reincidentes / ncRows.length) * 100).toFixed(1)) : 0;

  return {
    totalNc: ncRows.length,
    abertas,
    atrasadas,
    criticas,
    resolvidasNoPrazo,
    mttrDias,
    taxaReincidencia,
  };
}
