import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentUser } from "@/lib/auth/session";
import { decryptField, encryptField } from "@/lib/security/aes256";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";

export type DiarioItem = {
  id: string;
  obra_id: string;
  obra_nome: string;
  data_ref: string;
  clima: string | null;
  efetivo: number;
  equipamentos: string | null;
  ocorrencias: string | null;
  observacoes_ssma: string | null;
  assinatura_url: string | null;
};

export async function listDiarios(): Promise<DiarioItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeObraIds = await listActiveObraIds();
  const { data, error } = await supabase
    .from("diario_obra")
    .select("id, obra_id, data_ref, clima, efetivo, equipamentos, ocorrencias, observacoes_ssma, assinatura_url, obras(nome)")
    .eq("empresa_id", empresaId)
    .order("data_ref", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar diarios: ${error.message}`);
  }

  return (data ?? [])
    .filter((item) => activeObraIds.has(item.obra_id as string))
    .map((item) => ({
    id: item.id as string,
    obra_id: item.obra_id as string,
    obra_nome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
    data_ref: item.data_ref as string,
    clima: (item.clima as string | null) ?? null,
    efetivo: Number(item.efetivo ?? 0),
    equipamentos: decryptField((item.equipamentos as string | null) ?? null),
    ocorrencias: decryptField((item.ocorrencias as string | null) ?? null),
    observacoes_ssma: decryptField((item.observacoes_ssma as string | null) ?? null),
    assinatura_url: (item.assinatura_url as string | null) ?? null,
  }));
}

export async function createDiario(input: {
  obra_id: string;
  data_ref: string;
  clima?: string;
  efetivo: number;
  equipamentos?: string;
  ocorrencias?: string;
  observacoes_ssma?: string;
  assinatura_url?: string;
}) {
  const [empresaId, user] = await Promise.all([getEmpresaIdFromProfile(), getCurrentUser()]);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const supabase = await createServerClient();
  await ensureObraAtiva(input.obra_id);
  const { error } = await supabase.from("diario_obra").upsert(
    {
      empresa_id: empresaId,
      obra_id: input.obra_id,
      data_ref: input.data_ref,
      clima: input.clima ?? null,
      efetivo: input.efetivo,
      equipamentos: encryptField(input.equipamentos ?? null),
      ocorrencias: encryptField(input.ocorrencias ?? null),
      observacoes_ssma: encryptField(input.observacoes_ssma ?? null),
      assinatura_url: input.assinatura_url ?? null,
      created_by: user.id,
    },
    {
      onConflict: "empresa_id,obra_id,data_ref",
    },
  );

  if (error) {
    throw new Error(`Erro ao salvar diario: ${error.message}`);
  }
}
