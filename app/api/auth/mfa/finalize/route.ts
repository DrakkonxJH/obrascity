import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { createTenantAuthSession, getTenantSecurityPolicyByEmpresa } from "@/lib/db/seguranca-corporativa";
import { getRequestIpFromHeaders } from "@/lib/auth/master-access";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: "Sessão ausente." }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, empresa_id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { ok: false, message: `Erro ao carregar perfil: ${profileError.message}` },
      { status: 500 },
    );
  }

  if (!profile?.empresa_id || isControlTotalOwner(profile)) {
    return NextResponse.json({ ok: true, created: false });
  }

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) {
    return NextResponse.json(
      { ok: false, message: `Erro ao validar nível MFA: ${assuranceError.message}` },
      { status: 500 },
    );
  }

  const tenantPolicy = await getTenantSecurityPolicyByEmpresa(String(profile.empresa_id));
  const requiresMfa = tenantPolicy.mfa_required_roles.includes(String(profile.role ?? ""));
  if (requiresMfa && assurance?.currentLevel !== "aal2") {
    return NextResponse.json(
      { ok: false, message: "MFA ainda não foi concluído." },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get("of_tenant_session")?.value ?? null;
  if (existingSessionId) {
    return NextResponse.json({ ok: true, created: false });
  }

  const headerStore = await headers();
  const authSessionId = await createTenantAuthSession({
    empresaId: String(profile.empresa_id),
    profileId: String(profile.id),
    deviceLabel: headerStore.get("sec-ch-ua-platform") ?? "Dispositivo web",
    userAgent: headerStore.get("user-agent") ?? "N/A",
    ip: getRequestIpFromHeaders(headerStore),
  });

  if (authSessionId) {
    cookieStore.set("of_tenant_session", authSessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return NextResponse.json({ ok: true, created: Boolean(authSessionId) });
}
