"use server";

import { revalidatePath } from "next/cache";
import { createCronogramaItem, createDependenciaCronograma, createReplanejamento, snapshotBaseline } from "@/lib/db/cronograma";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";
import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

function mapTaskStatusToEtapa(status: string): "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Fechado" | "Perdido" {
  const s = status.toLowerCase();
  if (s.includes("conclu")) return "Fechado";
  if (s.includes("atras")) return "Negociação";
  if (s.includes("andamento") || s.includes("execucao") || s.includes("execução")) return "Proposta";
  if (s.includes("cancel")) return "Perdido";
  if (s.includes("planej")) return "Qualificação";
  return "Contato";
}

function mapTaskStatusToPrioridade(status: string): "Alta" | "Média" | "Baixa" {
  const s = status.toLowerCase();
  if (s.includes("atras")) return "Alta";
  if (s.includes("conclu")) return "Baixa";
  return "Média";
}

export async function createCronogramaAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const inicio = String(formData.get("inicio") ?? "").trim();
  const fim = String(formData.get("fim") ?? "").trim();
  const status = String(formData.get("status") ?? "planejado").trim();

  if (!obra_id || !nome || !inicio || !fim) {
    throw new Error("Campos obrigatorios do cronograma ausentes");
  }

  await createCronogramaItem({ obra_id, nome, inicio, fim, status });

  const [empresaId, supabase] = await Promise.all([getEmpresaIdFromProfile(), createServerClient()]);
  const obraRes = await supabase
    .from("obras")
    .select("nome, cliente")
    .eq("empresa_id", empresaId)
    .eq("id", obra_id)
    .single<{ nome: string; cliente: string | null }>();
  if (obraRes.error) {
    throw new Error(`Erro ao sincronizar tarefa com CRM (obra): ${obraRes.error.message}`);
  }

  const etapa = mapTaskStatusToEtapa(status);
  const prioridade = mapTaskStatusToPrioridade(status);
  const syncInsert = await supabase.from("crm_leads").insert({
    empresa_id: empresaId,
    nome: nome,
    contato: obraRes.data.cliente ?? "",
    cargo: "Gestão da obra",
    email: "",
    telefone: "",
    valor: 0,
    etapa,
    origem: "Cronograma",
    obra: obraRes.data.nome,
    prioridade,
    ultima_atividade: fim,
    notas: `Card gerado automaticamente a partir da tarefa do cronograma (${inicio} → ${fim}).`,
  });
  if (syncInsert.error) {
    throw new Error(`Erro ao sincronizar tarefa com CRM (card): ${syncInsert.error.message}`);
  }

  revalidatePath("/cronograma");
  revalidatePath("/crm");
}

export async function createDependenciaAction(formData: FormData) {
  const tarefa_predecessora_id = String(formData.get("tarefa_predecessora_id") ?? "").trim();
  const tarefa_sucessora_id = String(formData.get("tarefa_sucessora_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "finish_to_start").trim();

  if (!tarefa_predecessora_id || !tarefa_sucessora_id) {
    throw new Error("Dependencia requer predecessor e sucessor");
  }

  await createDependenciaCronograma({ tarefa_predecessora_id, tarefa_sucessora_id, tipo });
  revalidatePath("/cronograma");
}

export async function gerarBaselineAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  if (!obra_id) {
    throw new Error("Obra obrigatoria para baseline");
  }

  await snapshotBaseline(obra_id);
  revalidatePath("/cronograma");
}

export async function createReplanejamentoAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  const impacto_prazo_dias = Number(formData.get("impacto_prazo_dias") ?? 0);
  const impacto_custo = Number(formData.get("impacto_custo") ?? 0);

  if (!obra_id || !motivo) {
    throw new Error("Replanejamento exige obra e motivo");
  }

  const profile = await getCurrentProfile();
  if (!profile?.id || !isProfileRole(String(profile.role ?? ""))) {
    throw new Error("Perfil inválido para replanejamento");
  }

  const requiresApproval = requiresApprovalForAmount(profile.role, impacto_custo);
  const replanejamentoId = await createReplanejamento({
    obra_id,
    motivo,
    impacto_prazo_dias,
    impacto_custo,
    status: requiresApproval ? "em_aprovacao" : "aprovado",
  });

  if (requiresApproval) {
    await createApprovalRequest({
      entityType: "cronograma_change",
      entityId: replanejamentoId,
      entityRef: motivo,
      amount: impacto_custo,
      requesterRole: profile.role,
      requiredRole: resolveRequiredRoleByAmount(impacto_custo),
      notes: "Replanejamento com impacto financeiro exige aprovação.",
      metadata: { obraId: obra_id, impactoPrazoDias: impacto_prazo_dias },
    });
  }

  revalidatePath("/cronograma");
  revalidatePath("/governanca");
}
