import { cookies } from "next/headers";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const previewEmpresaId = cookieStore.get("of_support_preview_empresa_id")?.value ?? null;
  const previewProfileId = cookieStore.get("of_support_preview_profile_id")?.value ?? null;
  const previewSessionId = cookieStore.get("of_support_preview_session_id")?.value ?? null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, empresa_id, nome, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao carregar perfil: ${error.message}`);
  }

  if (data && isControlTotalOwner(data) && previewEmpresaId && previewSessionId) {
    const admin = createAdminClient();
    const sessionResult = await admin
      .from("tenant_impersonation_sessions")
      .select("id, empresa_id, profile_id, active, revoked_at, expires_at")
      .eq("id", previewSessionId)
      .eq("empresa_id", previewEmpresaId)
      .maybeSingle();

    if (!sessionResult.error && sessionResult.data) {
      const expired = new Date(String(sessionResult.data.expires_at ?? "")).getTime() <= Date.now();
      if (sessionResult.data.active && !sessionResult.data.revoked_at && !expired) {
        let query = admin.from("profiles").select("id, empresa_id, nome, email, role").eq("empresa_id", previewEmpresaId);
        if (previewProfileId) {
          query = query.eq("id", previewProfileId);
        }
        const previewResult = previewProfileId
          ? await query.maybeSingle()
          : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!previewResult.error && previewResult.data) {
          return previewResult.data;
        }
      }
    }

  }

  return data;
}
