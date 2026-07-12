import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";
import { isMissingRelation } from "@/lib/db/migration-guard";

export type MudancaItem = {
  id: string;
  obra_id: string;
  obraId: string;
  obra_nome: string;
  obraNome: string;
  tipo: string;
  titulo: string;
  descricao: string;
  impacto_prazo_dias: number;
  impactoPrazoDias: number;
  impacto_custo: number;
  impactoCusto: number;
  status: string;
  created_at: string;
};

export async function listMudancas(): Promise<MudancaItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("change_requests")
    .select("id, obra_id, tipo, titulo, descricao, impacto_prazo_dias, impacto_custo, status, created_at, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
    const obraId = String(item.obra_id ?? "");
    const obraNome = ((item.obras as { nome?: string } | null)?.nome ?? "Obra") as string;
    const impactoPrazoDias = Number(item.impacto_prazo_dias ?? 0);
    const impactoCusto = Number(item.impacto_custo ?? 0);

    return {
      id: String(item.id ?? ""),
      obra_id: obraId,
      obraId,
      obra_nome: obraNome,
      obraNome,
      tipo: String(item.tipo ?? ""),
      titulo: String(item.titulo ?? ""),
      descricao: String(item.descricao ?? ""),
      impacto_prazo_dias: impactoPrazoDias,
      impactoPrazoDias,
      impacto_custo: impactoCusto,
      impactoCusto,
      status: String(item.status ?? "pendente"),
      created_at: String(item.created_at ?? ""),
    };
  });
}

export async function createMudanca(input: {
  obraId: string;
  tipo: string;
  titulo: string;
  descricao: string;
  impactoPrazoDias: number;
  impactoCusto: number;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  if (!profile?.id || !isProfileRole(String(profile.role ?? ""))) {
    throw new Error("Perfil inválido para criar solicitação de mudança");
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("change_requests")
    .insert({
      empresa_id: empresaId,
      obra_id: input.obraId,
      tipo: input.tipo,
      titulo: input.titulo,
      descricao: input.descricao,
      impacto_prazo_dias: input.impactoPrazoDias,
      impacto_custo: input.impactoCusto,
      solicitado_por: profile.id,
      status: requiresApprovalForAmount(profile.role, input.impactoCusto) ? "em_aprovacao" : "aprovada",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (error && isMissingRelation(error.message)) {
      console.warn("[mudancas] tabela change_requests ausente, retornando sem persistir.");
      return;
    }
    throw new Error(`Erro ao criar solicitação de mudança: ${error?.message ?? "sem id"}`);
  }

  if (requiresApprovalForAmount(profile.role, input.impactoCusto)) {
    await createApprovalRequest({
      entityType: "cronograma_change",
      entityId: String(data.id),
      entityRef: input.titulo,
      amount: input.impactoCusto,
      requesterRole: profile.role,
      requiredRole: resolveRequiredRoleByAmount(input.impactoCusto),
      notes: "Mudança com impacto financeiro exige aprovação por alçada.",
      metadata: {
        obraId: input.obraId,
        impactoPrazoDias: input.impactoPrazoDias,
        tipo: input.tipo,
      },
    });
  }
}
