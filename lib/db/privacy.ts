import { createHash } from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { decryptField, encryptField } from "@/lib/security/aes256";

export type PrivacyRequestItem = {
  id: string;
  titular_email: string;
  tipo: string;
  status: string;
  observacao: string | null;
  created_at: string;
};

type PrivacyRequestInput = {
  tipo: "acesso" | "portabilidade" | "correcao" | "exclusao";
  observacao?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function listPrivacyRequests(limit = 20): Promise<PrivacyRequestItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("privacy_requests")
    .select("id, titular_email, tipo, status, observacao, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erro ao listar solicitacoes LGPD: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    titular_email: decryptField((row.titular_email as string | null) ?? "") ?? "",
    tipo: row.tipo as string,
    status: row.status as string,
    observacao: decryptField((row.observacao as string | null) ?? null),
    created_at: row.created_at as string,
  }));
}

export async function createPrivacyRequest(input: PrivacyRequestInput) {
  const [empresaId, user, profile] = await Promise.all([
    getEmpresaIdFromProfile(),
    getCurrentUser(),
    getCurrentProfile(),
  ]);

  if (!user?.email) {
    throw new Error("Usuário não autenticado");
  }

  const supabase = await createServerClient();
  const titularEmail = normalizeEmail(user.email);
  const titularEmailHash = createHash("sha256").update(titularEmail).digest("hex");

  const { error } = await supabase.from("privacy_requests").insert({
    empresa_id: empresaId,
    titular_email: encryptField(titularEmail),
    tipo: input.tipo,
    status: "aberto",
    observacao: encryptField(input.observacao ?? null),
    requested_by: profile?.id ?? null,
    payload: {
      titular_email_hash: titularEmailHash,
      requested_via: "configuracoes",
    },
  });

  if (error) {
    throw new Error(`Erro ao criar solicitacao LGPD: ${error.message}`);
  }
}

export async function logConsentEvent(input: {
  empresaId: string;
  profileId?: string | null;
  consentType: string;
  accepted: boolean;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("consent_events").insert({
    empresa_id: input.empresaId,
    profile_id: input.profileId ?? null,
    consent_type: input.consentType,
    accepted: input.accepted,
    ip_hash: input.ipHash ?? null,
    user_agent: input.userAgent ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Erro ao registrar consentimento: ${error.message}`);
  }
}
