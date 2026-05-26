import { getCurrentUser } from "@/lib/auth/session";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export type PortalShareItem = {
  id: string;
  token: string;
  descricao: string | null;
  active: boolean;
  expires_at: string | null;
  obra_ids: string[];
  created_at: string;
};

export type PortalShareResolved = {
  id: string;
  empresa_id: string;
  token: string;
  descricao: string | null;
  expires_at: string | null;
  active: boolean;
  obra_ids: string[];
};

function isMissingTable(errorMessage: string, tableName: string) {
  const message = errorMessage.toLowerCase();
  return (
    message.includes(tableName.toLowerCase()) &&
    (message.includes("does not exist") ||
      (message.includes("could not find the table") && message.includes("schema cache")))
  );
}

export async function listPortalShares(): Promise<PortalShareItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("portal_shares")
    .select("id, token, descricao, active, expires_at, obra_ids, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTable(error.message, "portal_shares")) {
      return [];
    }
    throw new Error(`Erro ao listar compartilhamentos do portal: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    token: String(row.token ?? ""),
    descricao: (row.descricao as string | null) ?? null,
    active: Boolean(row.active),
    expires_at: (row.expires_at as string | null) ?? null,
    obra_ids: Array.isArray(row.obra_ids) ? row.obra_ids.map((id) => String(id)) : [],
    created_at: String(row.created_at ?? ""),
  }));
}

export async function createPortalShare(input: { descricao?: string; expires_at?: string | null; obra_ids?: string[] }) {
  const [empresaId, user] = await Promise.all([getEmpresaIdFromProfile(), getCurrentUser()]);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("portal_shares")
    .insert({
      empresa_id: empresaId,
      descricao: input.descricao?.trim() || null,
      expires_at: input.expires_at || null,
      obra_ids: (input.obra_ids ?? []).filter((id) => typeof id === "string" && id.trim().length > 0),
      created_by: user.id,
      active: true,
    })
    .select("id, token")
    .single();

  if (error) {
    if (isMissingTable(error.message, "portal_shares")) {
      throw new Error("Compartilhamento do portal ainda não está disponível neste ambiente.");
    }
    throw new Error(`Erro ao criar link público do portal: ${error.message}`);
  }
  if (!data?.token) {
    throw new Error("Erro ao criar link público do portal: token não gerado");
  }

  return {
    id: data.id as string,
    token: data.token as string,
  };
}

export async function revokePortalShare(shareId: string) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("portal_shares")
    .update({ active: false })
    .eq("empresa_id", empresaId)
    .eq("id", shareId)
    .select("id");

  if (error) {
    if (isMissingTable(error.message, "portal_shares")) {
      throw new Error("Compartilhamento do portal ainda não está disponível neste ambiente.");
    }
    throw new Error(`Erro ao revogar link do portal: ${error.message}`);
  }
  if (!data?.length) {
    throw new Error("Erro ao revogar link do portal: link não encontrado");
  }
}

export async function resolvePortalShareByToken(token: string): Promise<PortalShareResolved | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("portal_shares")
    .select("id, empresa_id, token, descricao, expires_at, active, obra_ids")
    .eq("token", token)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error.message, "portal_shares")) {
      return null;
    }
    throw new Error(`Erro ao validar token do portal: ${error.message}`);
  }
  if (!data) return null;

  const expiresAt = (data.expires_at as string | null) ?? null;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return null;
  }

  return {
    id: data.id as string,
    empresa_id: data.empresa_id as string,
    token: data.token as string,
    descricao: (data.descricao as string | null) ?? null,
    expires_at: expiresAt,
    active: Boolean(data.active),
    obra_ids: Array.isArray(data.obra_ids) ? data.obra_ids.map((id) => String(id)) : [],
  };
}
