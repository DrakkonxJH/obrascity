import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole, type ProfileRole } from "@/lib/auth/roles";
import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { canApproveForRole } from "@/lib/approvals/policy";

export type ApprovalEntityType = "purchase_order" | "medicao" | "cronograma_change";

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
    .select("id, required_role, status")
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
}
