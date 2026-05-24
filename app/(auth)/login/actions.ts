"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeEmail } from "@/lib/security/signup-guard";
import { createSecurityAlert } from "@/lib/security/security-alerts";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppOrigin, getEnv } from "@/lib/validations/env";
import { provisionTrialTenant } from "@/lib/auth/provision-tenant";

export type LoginActionState = {
  ok: boolean;
  message: string;
};

export type ResendConfirmationState = {
  ok: boolean;
  message: string;
};

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
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

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
      .select("id, email, role")
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
        .select("id, email, role")
        .eq("id", userId)
        .maybeSingle();
      if (reloaded.error) {
        throw new Error(`Erro ao recarregar perfil apos provisionamento: ${reloaded.error.message}`);
      }
      profile = reloaded.data;
    }

    profileRole = String(profile?.role ?? "");

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
  const safeNext = isMasterOwner
    ? "/contas"
    : nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";
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
  const env = getEnv();
  const appOrigin = requestOrigin ?? getAppOrigin();
  const redirectBase = env.NEXT_PUBLIC_APP_URL ?? appOrigin;
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
