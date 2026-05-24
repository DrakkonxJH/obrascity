import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import type { Obra } from "@/types/domain";

export type ObraTrashItem = Obra & {
  deleted_at: string;
  deleted_by: string | null;
};

function isMissingTrashColumn(message: string) {
  const text = message.toLowerCase();
  return text.includes("deleted_at") && text.includes("does not exist");
}

export async function supportsObraTrash() {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase.from("obras").select("deleted_at", { head: true, count: "exact" }).eq("empresa_id", empresaId).limit(1);

  if (!error) {
    return true;
  }

  return false;
}

export async function listObras(): Promise<Obra[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const activeQuery = supabase
   .from("obras")
   .select("id, empresa_id, nome, cliente, status, progresso, created_at")
   .eq("empresa_id", empresaId)
   .is("deleted_at", null)
   .order("created_at", { ascending: false });

  const { data, error } = await activeQuery;

  if (!error) {
   return (data ?? []) as Obra[];
  }

  if (!isMissingTrashColumn(error.message)) {
   throw new Error(`Erro ao listar obras: ${error.message}`);
  }

  const fallback = await supabase
   .from("obras")
   .select("id, empresa_id, nome, cliente, status, progresso, created_at")
   .eq("empresa_id", empresaId)
   .order("created_at", { ascending: false });

  if (fallback.error) {
   throw new Error(`Erro ao listar obras: ${fallback.error.message}`);
  }

  return (fallback.data ?? []) as Obra[];
}

export async function listObrasTrash(): Promise<ObraTrashItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("obras")
    .select("id, empresa_id, nome, cliente, status, progresso, created_at, deleted_at, deleted_by")
    .eq("empresa_id", empresaId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    if (isMissingTrashColumn(error.message)) {
      return [];
    }
    throw new Error(`Erro ao listar lixeira de obras: ${error.message}`);
  }

  return (data ?? []) as ObraTrashItem[];
}

export async function ensureObraAtiva(obraId: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("obras")
    .select("id, empresa_id, nome, cliente, status, progresso, created_at")
    .eq("empresa_id", empresaId)
    .eq("id", obraId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error("Obra não encontrada ou está na lixeira");
  }

  return data as Obra;
}

export async function softDeleteObra(obraId: string, deletedBy: string) {
  const trashEnabled = await supportsObraTrash();
  if (!trashEnabled) {
    throw new Error("Lixeira indisponível até aplicar a migration 0014");
  }

  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("obras")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("empresa_id", empresaId)
    .eq("id", obraId)
    .is("deleted_at", null)
    .select("id");

  if (error || !data?.length) {
    throw new Error(`Erro ao mover obra para lixeira: ${error?.message ?? "obra não encontrada"}`);
  }
}

export async function restoreObra(obraId: string) {
  const trashEnabled = await supportsObraTrash();
  if (!trashEnabled) {
    throw new Error("Lixeira indisponível até aplicar a migration 0014");
  }

  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("obras")
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq("empresa_id", empresaId)
    .eq("id", obraId)
    .not("deleted_at", "is", null)
    .select("id");

  if (error || !data?.length) {
    throw new Error(`Erro ao restaurar obra: ${error?.message ?? "obra não encontrada"}`);
  }
}

export async function listActiveObraIds() {
  const obras = await listObras();
  return new Set(obras.map((obra) => obra.id));
}

export async function createObra(input: {
  nome: string;
  cliente: string;
  status?: Obra["status"];
}) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const trashEnabled = await supportsObraTrash();

  const payload: Record<string, unknown> = {
    empresa_id: empresaId,
    nome: input.nome,
    cliente: input.cliente,
    status: input.status ?? "planejamento",
    progresso: 0,
  };

  if (trashEnabled) {
    payload.deleted_at = null;
    payload.deleted_by = null;
  }

  const { error } = await supabase.from("obras").insert(payload);

  if (error) {
    throw new Error(`Erro ao criar obra: ${error.message}`);
  }
}

export async function updateObra(
  obraId: string,
  input: {
    nome: string;
    cliente: string;
    status: Obra["status"];
    progresso: number;
  },
) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const trashEnabled = await supportsObraTrash();

  let query = supabase
    .from("obras")
    .update({
      nome: input.nome,
      cliente: input.cliente,
      status: input.status,
      progresso: input.progresso,
    })
    .eq("empresa_id", empresaId)
    .eq("id", obraId);

  if (trashEnabled) {
    query = query.is("deleted_at", null);
  }

  const { error, data } = await query.select("id");
  if (error || !data?.length) {
    throw new Error(`Erro ao atualizar obra: ${error?.message ?? "obra não encontrada"}`);
  }
}

export async function getDashboardResumo() {
  const obras = await listObras();
  const atencao = obras.filter((obra) => obra.status === "atencao").length;
  const andamento = obras.filter((obra) => obra.status === "andamento").length;
  const concluidas = obras.filter((obra) => obra.status === "concluida").length;

  return {
    total: obras.length,
    atencao,
    andamento,
    concluidas,
  };
}
