import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";

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

  return data as CrmLead;
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

  return data as CrmLead;
}

export async function deleteCrmLead(id: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("crm_leads")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("id", id);
  if (error) {
    throw new Error(`Erro ao remover lead do CRM: ${error.message}`);
  }
}
