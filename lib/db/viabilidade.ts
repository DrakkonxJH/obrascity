import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type ViabilidadeItem = {
  id: string;
  obra_id: string;
  status_tecnico: string;
  status_legal: string;
  status_economico: string;
  go_no_go: string;
  parecer: string;
  updated_at: string;
};

export async function listViabilidade(): Promise<ViabilidadeItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("viabilidade_estudos")
    .select("id, obra_id, status_tecnico, status_legal, status_economico, go_no_go, parecer, updated_at")
    .eq("empresa_id", empresaId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar viabilidade: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    obra_id: String(item.obra_id ?? ""),
    status_tecnico: String(item.status_tecnico ?? "pendente"),
    status_legal: String(item.status_legal ?? "pendente"),
    status_economico: String(item.status_economico ?? "pendente"),
    go_no_go: String(item.go_no_go ?? "pendente"),
    parecer: String(item.parecer ?? ""),
    updated_at: String(item.updated_at ?? ""),
  }));
}

export async function upsertViabilidade(input: {
  obraId: string;
  statusTecnico: string;
  statusLegal: string;
  statusEconomico: string;
  goNoGo: string;
  parecer: string;
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("viabilidade_estudos").upsert(
    {
      empresa_id: empresaId,
      obra_id: input.obraId,
      status_tecnico: input.statusTecnico,
      status_legal: input.statusLegal,
      status_economico: input.statusEconomico,
      go_no_go: input.goNoGo,
      parecer: input.parecer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,obra_id" },
  );

  if (error) {
    throw new Error(`Erro ao salvar viabilidade: ${error.message}`);
  }
}
