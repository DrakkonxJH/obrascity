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
  created_at: string;
};

export type PortalShareResolved = {
  id: string;
  empresa_id: string;
  token: string;
  descricao: string | null;
  expires_at: string | null;
  active: boolean;
};

export async function listPortalShares(): Promise<PortalShareItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("portal_shares")
    .select("id, token, descricao, active, expires_at, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar compartilhamentos do portal: ${error.message}`);
  }

  return (data ?? []) as PortalShareItem[];
}

export async function createPortalShare(input: { descricao?: string; expires_at?: string | null }) {
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
      created_by: user.id,
      active: true,
    })
    .select("id, token")
    .single();

  if (error || !data?.token) {
    throw new Error(`Erro ao criar link público do portal: ${error?.message ?? "token não gerado"}`);
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

  if (error || !data?.length) {
    throw new Error(`Erro ao revogar link do portal: ${error?.message ?? "link não encontrado"}`);
  }
}

export async function resolvePortalShareByToken(token: string): Promise<PortalShareResolved | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("portal_shares")
    .select("id, empresa_id, token, descricao, expires_at, active")
    .eq("token", token)
    .eq("active", true)
    .maybeSingle();

  if (error) {
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
  };
}
