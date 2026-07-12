"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCronogramaItem,
  createDependenciaCronograma,
  createReplanejamento,
  deleteCronogramaItem,
  listDependenciasCronograma,
  snapshotBaseline,
  updateCronogramaItem,
} from "@/lib/db/cronograma";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";
import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { deleteCrmLeadFromCronogramaTask, upsertCrmLeadFromCronogramaTask } from "@/lib/db/crm";

function getReturnTo(formData: FormData) {
  const returnTo = String(formData.get("return_to") ?? "/cronograma").trim();
  if (!returnTo.startsWith("/cronograma")) return "/cronograma";
  return returnTo;
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

  const tarefaId = await createCronogramaItem({ obra_id, nome, inicio, fim, status });

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

  await upsertCrmLeadFromCronogramaTask({
    taskId: tarefaId,
    nome,
    status,
    inicio,
    fim,
    obraNome: obraRes.data.nome,
    clienteNome: obraRes.data.cliente ?? "",
  });

  revalidatePath("/cronograma");
  revalidatePath("/crm");
  redirect(`${getReturnTo(formData)}&ok=tarefa_criada`);
}

export async function updateCronogramaAction(formData: FormData) {
  const tarefa_id = String(formData.get("tarefa_id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const inicio = String(formData.get("inicio") ?? "").trim();
  const fim = String(formData.get("fim") ?? "").trim();
  const status = String(formData.get("status") ?? "planejado").trim();

  if (!tarefa_id || !nome || !inicio || !fim) {
    throw new Error("Campos obrigatórios para atualização da tarefa estão ausentes");
  }

  const updated = await updateCronogramaItem({
    id: tarefa_id,
    nome,
    inicio,
    fim,
    status,
  });

  const [empresaId, supabase] = await Promise.all([getEmpresaIdFromProfile(), createServerClient()]);
  const obraRes = await supabase
    .from("obras")
    .select("nome, cliente")
    .eq("empresa_id", empresaId)
    .eq("id", updated.obraId)
    .single<{ nome: string; cliente: string | null }>();

  if (obraRes.error) {
    throw new Error(`Erro ao sincronizar atualização da tarefa com CRM: ${obraRes.error.message}`);
  }

  await upsertCrmLeadFromCronogramaTask({
    taskId: tarefa_id,
    nome,
    status,
    inicio,
    fim,
    obraNome: obraRes.data.nome,
    clienteNome: obraRes.data.cliente ?? "",
  });

  revalidatePath("/cronograma");
  revalidatePath("/crm");
  redirect(`${getReturnTo(formData)}&ok=tarefa_atualizada`);
}

export async function deleteCronogramaAction(formData: FormData) {
  const tarefa_id = String(formData.get("tarefa_id") ?? "").trim();
  const confirmDelete = String(formData.get("confirm_delete") ?? "").trim();
  if (!tarefa_id) {
    throw new Error("ID da tarefa é obrigatório para remoção");
  }
  if (confirmDelete !== "yes") {
    throw new Error("Confirmação obrigatória para excluir tarefa.");
  }

  await deleteCronogramaItem(tarefa_id);
  await deleteCrmLeadFromCronogramaTask(tarefa_id);

  revalidatePath("/cronograma");
  revalidatePath("/crm");
  redirect(`${getReturnTo(formData)}&ok=tarefa_excluida`);
}

export async function createDependenciaAction(formData: FormData) {
  const tarefa_predecessora_id = String(formData.get("tarefa_predecessora_id") ?? "").trim();
  const tarefa_sucessora_id = String(formData.get("tarefa_sucessora_id") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "finish_to_start").trim();

  if (!tarefa_predecessora_id || !tarefa_sucessora_id) {
    throw new Error("Dependencia requer predecessor e sucessor");
  }
  if (tarefa_predecessora_id === tarefa_sucessora_id) {
    throw new Error("Dependência inválida: predecessor e sucessor não podem ser a mesma tarefa.");
  }

  const deps = await listDependenciasCronograma();
  const graph = new Map<string, Set<string>>();
  for (const dep of deps) {
    if (!graph.has(dep.tarefaPredecessoraId)) graph.set(dep.tarefaPredecessoraId, new Set());
    graph.get(dep.tarefaPredecessoraId)?.add(dep.tarefaSucessoraId);
  }
  if (!graph.has(tarefa_predecessora_id)) graph.set(tarefa_predecessora_id, new Set());
  graph.get(tarefa_predecessora_id)?.add(tarefa_sucessora_id);

  const seen = new Set<string>();
  const stack = [tarefa_sucessora_id];
  let hasCycle = false;
  while (stack.length > 0 && !hasCycle) {
    const node = stack.pop()!;
    if (node === tarefa_predecessora_id) {
      hasCycle = true;
      break;
    }
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of graph.get(node) ?? []) stack.push(next);
  }
  if (hasCycle) {
    throw new Error("Dependência inválida: criação geraria ciclo no cronograma.");
  }

  await createDependenciaCronograma({ tarefa_predecessora_id, tarefa_sucessora_id, tipo });
  revalidatePath("/cronograma");
  redirect(`${getReturnTo(formData)}&ok=dependencia_criada`);
}

export async function gerarBaselineAction(formData: FormData) {
  const obra_id = String(formData.get("obra_id") ?? "").trim();
  if (!obra_id) {
    throw new Error("Obra obrigatoria para baseline");
  }

  await snapshotBaseline(obra_id);
  revalidatePath("/cronograma");
  redirect(`${getReturnTo(formData)}&ok=baseline_gerada`);
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
  redirect(`${getReturnTo(formData)}&ok=replanejamento_registrado`);
}
