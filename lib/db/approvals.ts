import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole, type ProfileRole } from "@/lib/auth/roles";
import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { canApproveForRole } from "@/lib/approvals/policy";

export type ApprovalEntityType = "purchase_order" | "medicao" | "cronograma_change";

export type ApprovalRequestItem = {
  id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  entity_ref: string | null;
  amount: number;
  requester_id: string | null;
  requester_role: ProfileRole;
  required_role: ProfileRole;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
};

export async function createApprovalRequest(input: {
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef?: string;
  amount: number;
  requesterRole: ProfileRole;
  requiredRole: ProfileRole;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  if (!profile?.id) {
    throw new Error("Usuário não autenticado para solicitar aprovação");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("approval_requests").insert({
    empresa_id: empresaId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    entity_ref: input.entityRef ?? null,
    amount: input.amount,
    requester_id: profile.id,
    requester_role: input.requesterRole,
    required_role: input.requiredRole,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Erro ao criar solicitação de aprovação: ${error.message}`);
  }
}

export async function approveRequest(input: { approvalId: string; note?: string }) {
  const profile = await getCurrentProfile();
  if (!profile?.id || !isProfileRole(String(profile.role ?? ""))) {
    throw new Error("Perfil inválido para aprovar solicitação");
  }
  const approverRole = profile.role as ProfileRole;
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data: approval, error: approvalError } = await supabase
    .from("approval_requests")
    .select("id, entity_type, entity_id, required_role, status")
    .eq("empresa_id", empresaId)
    .eq("id", input.approvalId)
    .single();

  if (approvalError || !approval) {
    throw new Error(`Solicitação de aprovação não encontrada: ${approvalError?.message}`);
  }

  const requiredRole = String(approval.required_role ?? "");
  if (!isProfileRole(requiredRole)) {
    throw new Error("Solicitação com role inválido");
  }
  if (!canApproveForRole(approverRole, requiredRole)) {
    throw new Error("Seu perfil não possui alçada para aprovar essa solicitação");
  }

  const entityType = String(approval.entity_type ?? "");
  const entityId = String(approval.entity_id ?? "");
  if (!entityId) {
    throw new Error("Solicitação com entidade inválida");
  }

  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
      notes: input.note ?? null,
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.approvalId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Erro ao aprovar solicitação: ${error.message}`);
  }

  if (entityType === "purchase_order") {
    const { error: entityError } = await supabase
      .from("pedidos_compra")
      .update({ status: "aprovado" })
      .eq("empresa_id", empresaId)
      .eq("id", entityId);
    if (entityError) {
      throw new Error(`Erro ao aprovar pedido de compra vinculado: ${entityError.message}`);
    }
  } else if (entityType === "medicao") {
    const { error: entityError } = await supabase
      .from("medicoes")
      .update({
        status: "aprovada",
        aprovado_por: profile.id,
        aprovado_em: new Date().toISOString(),
      })
      .eq("empresa_id", empresaId)
      .eq("id", entityId);
    if (entityError) {
      throw new Error(`Erro ao aprovar medição vinculada: ${entityError.message}`);
    }
  }
}

export async function rejectRequest(input: { approvalId: string; note?: string }) {
  const profile = await getCurrentProfile();
  if (!profile?.id || !isProfileRole(String(profile.role ?? ""))) {
    throw new Error("Perfil inválido para rejeitar solicitação");
  }
  const approverRole = profile.role as ProfileRole;
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const { data: approval, error: approvalError } = await supabase
    .from("approval_requests")
    .select("id, entity_type, entity_id, required_role, status")
    .eq("empresa_id", empresaId)
    .eq("id", input.approvalId)
    .single();

  if (approvalError || !approval) {
    throw new Error(`Solicitação de aprovação não encontrada: ${approvalError?.message}`);
  }
  if (String(approval.status ?? "") !== "pending") {
    throw new Error("Somente solicitações pendentes podem ser rejeitadas");
  }

  const requiredRole = String(approval.required_role ?? "");
  if (!isProfileRole(requiredRole)) {
    throw new Error("Solicitação com role inválido");
  }
  if (!canApproveForRole(approverRole, requiredRole)) {
    throw new Error("Seu perfil não possui alçada para rejeitar essa solicitação");
  }

  const entityType = String(approval.entity_type ?? "");
  const entityId = String(approval.entity_id ?? "");
  if (!entityId) {
    throw new Error("Solicitação com entidade inválida");
  }

  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: "rejected",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
      notes: input.note ?? null,
    })
    .eq("empresa_id", empresaId)
    .eq("id", input.approvalId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Erro ao rejeitar solicitação: ${error.message}`);
  }

  if (entityType === "purchase_order") {
    const { error: entityError } = await supabase
      .from("pedidos_compra")
      .update({ status: "rejeitado" })
      .eq("empresa_id", empresaId)
      .eq("id", entityId);
    if (entityError) {
      throw new Error(`Erro ao rejeitar pedido de compra vinculado: ${entityError.message}`);
    }
  } else if (entityType === "medicao") {
    const { error: entityError } = await supabase
      .from("medicoes")
      .update({
        status: "rejeitada",
        aprovado_por: null,
        aprovado_em: null,
      })
      .eq("empresa_id", empresaId)
      .eq("id", entityId);
    if (entityError) {
      throw new Error(`Erro ao rejeitar medição vinculada: ${entityError.message}`);
    }
  }
}

export async function listApprovalRequests(input?: {
  status?: "pending" | "approved" | "rejected";
  limit?: number;
}): Promise<ApprovalRequestItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const maxRows = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  let query = supabase
    .from("approval_requests")
    .select(
      "id, entity_type, entity_id, entity_ref, amount, requester_id, requester_role, required_role, status, approved_by, approved_at, notes, created_at",
    )
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(maxRows);

  if (input?.status) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Erro ao listar aprovações: ${error.message}`);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows
    .filter(
      (item) =>
        isProfileRole(String(item.requester_role ?? "")) &&
        isProfileRole(String(item.required_role ?? "")) &&
        ["purchase_order", "medicao", "cronograma_change"].includes(String(item.entity_type ?? "")),
    )
    .map((item) => ({
      id: String(item.id ?? ""),
      entity_type: String(item.entity_type ?? "") as ApprovalEntityType,
      entity_id: String(item.entity_id ?? ""),
      entity_ref: item.entity_ref ? String(item.entity_ref) : null,
      amount: Number(item.amount ?? 0),
      requester_id: item.requester_id ? String(item.requester_id) : null,
      requester_role: String(item.requester_role) as ProfileRole,
      required_role: String(item.required_role) as ProfileRole,
      status: String(item.status ?? ""),
      approved_by: item.approved_by ? String(item.approved_by) : null,
      approved_at: item.approved_at ? String(item.approved_at) : null,
      notes: item.notes ? String(item.notes) : null,
      created_at: String(item.created_at ?? ""),
    }));
}
