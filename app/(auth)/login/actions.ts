"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeEmail } from "@/lib/security/signup-guard";
import { createSecurityAlert } from "@/lib/security/security-alerts";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { getControlTotalAllowedIps, getRequestIpFromHeaders, isMasterIpAllowed } from "@/lib/auth/master-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePublicAppOrigin } from "@/lib/validations/env";
import { provisionTrialTenant } from "@/lib/auth/provision-tenant";
import { createTenantAuthSession, getTenantSecurityPolicyByEmpresa } from "@/lib/db/seguranca-corporativa";
import { buildMfaChallengePath, buildMfaSetupPath, getMfaRequirementForProfile, getPostLoginPath } from "@/lib/auth/mfa";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export type LoginActionState = {
  ok: boolean;
  message: string;
};

export type ResendConfirmationState = {
  ok: boolean;
  message: string;
};

export type SsoLoginState = {
  ok: boolean;
  message: string;
};

function mapSsoProvider(provider: string): Provider | null {
  const normalized = provider.trim().toLowerCase();
  if (normalized === "azuread" || normalized === "azure") return "azure";
  if (normalized === "google") return "google";
  if (normalized === "github") return "github";
  if (normalized === "gitlab") return "gitlab";
  return null;
}

export async function signInAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { ok: false, message: "Informe e-mail e senha." };
  }

  const headerStore = await headers();
  const ip = getRequestIpFromHeaders(headerStore);

  const limit = await checkRateLimit({
    key: `login:${ip}:${email}`,
    limit: 10,
    windowSeconds: 15 * 60,
  });

  if (!limit.allowed) {
    await createSecurityAlert({
      category: "login",
      severity: "high",
      reason: "login_rate_limit",
      email,
      ip,
      metadata: {
        retryAfter: limit.retryAfter,
      },
    });
    return {
      ok: false,
      message: "Muitas tentativas de login. Aguarde alguns minutos.",
    };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await createSecurityAlert({
      category: "login",
      severity: "medium",
      reason: "login_auth_error",
      email,
      ip,
      metadata: {
        error: error.message,
      },
    });
    return { ok: false, message: error.message };
  }

  let profileRole = "";
  const userId = data.user?.id;
  if (userId) {
    const { data: initialProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, empresa_id, email, role")
      .eq("id", userId)
      .maybeSingle();
    let profile = initialProfile;

    if (profileError) {
      throw new Error(`Erro ao validar perfil apos login: ${profileError.message}`);
    }

    // Auto-reparo: se usuário confirmado entrar sem profile (ex.: callback não provisionou),
    // provisiona tenant trial imediatamente para evitar loop em /conta-pendente.
    if (!profile && data.user?.email) {
      const nome = String(data.user.user_metadata?.nome ?? data.user.email.split("@")[0] ?? "Usuário");
      const empresaNome = String(data.user.user_metadata?.empresa_nome ?? "Nova empresa");
      await provisionTrialTenant({
        userId,
        email: data.user.email,
        nome,
        empresaNome,
      });

      const reloaded = await supabase
        .from("profiles")
        .select("id, empresa_id, email, role")
        .eq("id", userId)
        .maybeSingle();
      if (reloaded.error) {
        throw new Error(`Erro ao recarregar perfil apos provisionamento: ${reloaded.error.message}`);
      }
      profile = reloaded.data;
    }

    profileRole = String(profile?.role ?? "");
    const empresaId = String(profile?.empresa_id ?? "");
    const isMasterOwner = isControlTotalOwner({
      id: data.user?.id,
      email: data.user?.email ?? null,
      role: profileRole,
    });

    if (isMasterOwner) {
      if (!isMasterIpAllowed(ip)) {
        await supabase.auth.signOut();
        return {
          ok: false,
          message: `A conta master só pode acessar a partir dos IPs permitidos${getControlTotalAllowedIps().length > 0 ? "." : " (allowlist não configurada)."}`,
        };
      }

    }

    const safeNext = getPostLoginPath(isMasterOwner, nextPath);
    const mfaRequirement = await getMfaRequirementForProfile({
      id: profile?.id,
      email: data.user?.email ?? null,
      role: profileRole,
      empresa_id: empresaId,
    });

    if (mfaRequirement.required) {
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) {
        await supabase.auth.signOut();
        return {
          ok: false,
          message: `Falha ao validar segundo fator: ${assuranceError.message}`,
        };
      }

      if (assurance.currentLevel !== "aal2") {
        if (mfaRequirement.reason === "master" && assurance.nextLevel !== "aal2") {
          await createSecurityAlert({
            category: "login",
            severity: "high",
            reason: "master_mfa_enrollment_required",
            email,
            ip,
            metadata: {
              role: profileRole,
            },
          });
        }

        if (mfaRequirement.reason === "tenant-role" && assurance.nextLevel !== "aal2") {
          await createSecurityAlert({
            category: "login",
            severity: "high",
            reason: "mfa_required_not_enrolled",
            email,
            ip,
            metadata: {
              role: profileRole,
              empresaId,
            },
          });
        }

        redirect(assurance.nextLevel === "aal2" ? buildMfaChallengePath(safeNext) : buildMfaSetupPath(safeNext));
      }
    }

    if (empresaId && !isMasterOwner) {
      if (profile?.id) {
        const deviceLabel = headerStore.get("sec-ch-ua-platform") ?? "Dispositivo web";
        const userAgent = headerStore.get("user-agent") ?? "N/A";
        const authSessionId = await createTenantAuthSession({
          empresaId,
          profileId: profile.id,
          deviceLabel,
          userAgent,
          ip,
        });
        if (authSessionId) {
          const cookieStore = await cookies();
          cookieStore.set("of_tenant_session", authSessionId, {
            httpOnly: true,
            sameSite: "lax",
            secure: IS_PRODUCTION,
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      }
    }

    if (profile?.role === "administrador" && (data.user?.factors?.length ?? 0) === 0) {
      await createSecurityAlert({
        category: "login",
        severity: "high",
        reason: "admin_without_2fa",
        email,
        ip,
      });
    }
  }

  const isMasterOwner = isControlTotalOwner({
    id: data.user?.id,
    email: data.user?.email ?? null,
    role: profileRole,
  });
  const safeNext = getPostLoginPath(isMasterOwner, nextPath);
  redirect(safeNext);
}

export async function resendConfirmationAction(
  _prev: ResendConfirmationState,
  formData: FormData,
): Promise<ResendConfirmationState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { ok: false, message: "Informe o e-mail para reenviar a confirmação." };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const hostHeader = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const normalizedHost = hostHeader?.split(",")[0]?.trim();
  const normalizedProto = forwardedProto?.split(",")[0]?.trim();
  const requestOrigin =
    normalizedHost && normalizedProto && /^https?$/.test(normalizedProto)
      ? `${normalizedProto}://${normalizedHost}`
      : normalizedHost
        ? `https://${normalizedHost}`
        : null;

  const limit = await checkRateLimit({
    key: `resend-confirmation:${ip}:${email}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });

  if (!limit.allowed) {
    return {
      ok: false,
      message: "Muitas solicitações. Aguarde alguns minutos para reenviar.",
    };
  }

  const admin = createAdminClient();
  const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authUser = (users.data?.users ?? []).find(
    (user) => String(user.email ?? "").toLowerCase() === email,
  );

  // Bloqueio solicitado: só reenviar para e-mails que já tenham cadastro solicitado.
  if (!authUser?.id) {
    return {
      ok: false,
      message: "Só é possível reenviar para e-mails que já solicitaram cadastro.",
    };
  }

  if (authUser.email_confirmed_at) {
    return {
      ok: false,
      message: "Este e-mail já está confirmado. Faça login normalmente.",
    };
  }

  const supabase = await createServerClient();
  const redirectBase = resolvePublicAppOrigin(requestOrigin);
  const redirectTo = `${redirectBase.replace(/\/$/, "")}/auth/callback`;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    await createSecurityAlert({
      category: "signup",
      severity: "medium",
      reason: "resend_confirmation_failed",
      email,
      ip,
      metadata: {
        error: error.message,
      },
    });
    return { ok: false, message: `Falha ao reenviar confirmação: ${error.message}` };
  }

  return {
    ok: true,
    message: "E-mail de confirmação reenviado. Verifique sua caixa de entrada.",
  };
}

export async function startSsoLoginAction(
  _prev: SsoLoginState,
  formData: FormData,
): Promise<SsoLoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { ok: false, message: "Informe o e-mail corporativo para SSO." };
  }

  const admin = createAdminClient();
  const profileResult = await admin
    .from("profiles")
    .select("id, empresa_id")
    .eq("email", email)
    .maybeSingle();
  if (profileResult.error || !profileResult.data?.empresa_id) {
    return { ok: false, message: "Perfil sem empresa vinculada para SSO." };
  }

  const empresaId = String(profileResult.data.empresa_id);
  const policy = await getTenantSecurityPolicyByEmpresa(empresaId);
  if (!policy.sso_enabled) {
    return { ok: false, message: "SSO não está habilitado para sua empresa." };
  }

  const provider = mapSsoProvider(policy.sso_provider);
  if (!provider) {
    return { ok: false, message: "Provedor SSO inválido ou não suportado." };
  }

  const supabase = await createServerClient();
  const callback = resolvePublicAppOrigin(null).replace(/\/$/, "");
  const oauth = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${callback}/auth/callback`,
    },
  });

  if (oauth.error || !oauth.data?.url) {
    return { ok: false, message: `Falha ao iniciar SSO: ${oauth.error?.message ?? "sem URL de redirecionamento"}` };
  }
  redirect(oauth.data.url);
}
