import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isMissingRelation } from "@/lib/db/migration-guard";

export type GarantiaChamadoItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  unidade: string;
  sistema: string;
  titulo: string;
  descricao: string;
  criticidade: string;
  status: string;
  sla_horas: number;
  created_at: string;
  resolvido_em: string | null;
};

export type GarantiaInteracaoItem = {
  id: string;
  chamado_id: string;
  tipo: string;
  mensagem: string;
  autor_id: string | null;
  created_at: string;
};

export async function listGarantiaChamados(): Promise<GarantiaChamadoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garantia_chamados")
    .select("id, obra_id, unidade, sistema, titulo, descricao, criticidade, status, sla_horas, created_at, resolvido_em, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    obra_id: String(row.obra_id ?? ""),
    obra_nome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
    unidade: String(row.unidade ?? ""),
    sistema: String(row.sistema ?? ""),
    titulo: String(row.titulo ?? ""),
    descricao: String(row.descricao ?? ""),
    criticidade: String(row.criticidade ?? "media"),
    status: String(row.status ?? "aberto"),
    sla_horas: Number(row.sla_horas ?? 24),
    created_at: String(row.created_at ?? ""),
    resolvido_em: row.resolvido_em ? String(row.resolvido_em) : null,
  }));
}

export async function createGarantiaChamado(input: {
  obraId: string;
  unidade: string;
  sistema: string;
  titulo: string;
  descricao: string;
  criticidade: string;
  slaHoras: number;
}) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  const now = new Date();
  const prazoResposta = new Date(now.getTime() + Math.max(input.slaHoras, 1) * 60 * 60 * 1000);
  const prazoSolucao = new Date(now.getTime() + Math.max(input.slaHoras, 1) * 2 * 60 * 60 * 1000);
  const supabase = await createServerClient();
  const { error } = await supabase.from("garantia_chamados").insert({
    empresa_id: empresaId,
    obra_id: input.obraId,
    unidade: input.unidade,
    sistema: input.sistema,
    titulo: input.titulo,
    descricao: input.descricao,
    criticidade: input.criticidade,
    sla_horas: input.slaHoras,
    aberto_por: profile?.id ?? null,
    prazo_resposta_em: prazoResposta.toISOString(),
    prazo_solucao_em: prazoSolucao.toISOString(),
  });

  if (error) {
    if (isMissingRelation(error.message)) {
      console.warn("[garantia] tabela garantia_chamados ausente, retornando sem persistir.");
      return;
    }
    throw new Error(`Erro ao abrir chamado de garantia: ${error.message}`);
  }
}

export async function updateGarantiaStatus(chamadoId: string, status: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "resolvido") {
    payload.resolvido_em = new Date().toISOString();
  }
  const { error } = await supabase
    .from("garantia_chamados")
    .update(payload)
    .eq("empresa_id", empresaId)
    .eq("id", chamadoId);

  if (error) {
    if (isMissingRelation(error.message)) {
      console.warn("[garantia] tabela garantia_chamados ausente, retornando sem persistir.");
      return;
    }
    throw new Error(`Erro ao atualizar status de garantia: ${error.message}`);
  }
}

export async function listGarantiaInteracoes(chamadoId: string): Promise<GarantiaInteracaoItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("garantia_interacoes")
    .select("id, chamado_id, tipo, mensagem, autor_id, created_at")
    .eq("empresa_id", empresaId)
    .eq("chamado_id", chamadoId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    chamado_id: String(row.chamado_id ?? ""),
    tipo: String(row.tipo ?? "comentario"),
    mensagem: String(row.mensagem ?? ""),
    autor_id: row.autor_id ? String(row.autor_id) : null,
    created_at: String(row.created_at ?? ""),
  }));
}

export async function createGarantiaInteracao(input: { chamadoId: string; mensagem: string; tipo: string }) {
  const [empresaId, profile] = await Promise.all([getEmpresaIdFromProfile(), getCurrentProfile()]);
  const supabase = await createServerClient();
  const { error } = await supabase.from("garantia_interacoes").insert({
    empresa_id: empresaId,
    chamado_id: input.chamadoId,
    autor_id: profile?.id ?? null,
    tipo: input.tipo,
    mensagem: input.mensagem,
  });

  if (error) {
    if (isMissingRelation(error.message)) {
      console.warn("[garantia] tabela garantia_interacoes ausente, retornando sem persistir.");
      return;
    }
    throw new Error(`Erro ao registrar interação de garantia: ${error.message}`);
  }
}

