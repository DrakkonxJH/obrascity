"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/auth/signup-schema";
import { getAppOrigin, getEnv } from "@/lib/validations/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSignupRateLimits, emailAlreadyRegistered } from "@/lib/security/signup-guard";
import {
  deleteSignupVerificationByEmail,
  findPendingSignupVerification,
  issueSignupVerification,
} from "@/lib/auth/signup-verification";
import { invokeSignupEdgeFunction } from "@/lib/auth/signup-edge-client";
import { createSecurityAlert } from "@/lib/security/security-alerts";

export type SignupActionState = {
  ok: boolean;
  message: string;
  needsEmailConfirmation?: boolean;
  needsLogin?: boolean;
};

export async function signUpAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip");
  const userAgent = headerStore.get("user-agent");
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

  const parsed = signupSchema.safeParse({
    nome: formData.get("nome"),
    empresaNome: formData.get("empresaNome"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados invalidos";
    return { ok: false, message };
  }

  const signupData = parsed.data;
  if (!signupData) {
    return { ok: false, message: "Dados invalidos" };
  }

  const {
    nome,
    empresaNome,
    email,
    password,
  } = signupData;

  let createdUserId: string | null = null;
  let admin;
  const env = getEnv();
  const canUseLegacyEdgeFallback = /^eyJ[A-Za-z0-9_-]+\./.test(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  try {
    admin = createAdminClient();
  } catch (adminError) {
    const message = adminError instanceof Error ? adminError.message : "Erro ao configurar admin";
    await createSecurityAlert({
      category: "signup",
      severity: "high",
      reason: "admin_client_init_error",
      email,
      ip: ip ?? null,
      metadata: {
        error: message,
      },
    });
    return {
      ok: false,
      message: "Sistema indisponível. Tente novamente em alguns minutos.",
    };
  }

  function isInvalidJwtLikeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /invalid jwt|jwt|auth session/i.test(message);
  }

  async function runLegacySignupFlow() {
    if (!canUseLegacyEdgeFallback) {
      return {
        ok: false,
        message:
          "Fluxo legado de cadastro indisponível com chave publishable atual. Aplique a migration de verificação (0015) e recarregue o schema cache do Supabase.",
      };
    }

    const edgeResult = await invokeSignupEdgeFunction({
      nome,
      empresaNome,
      email,
      password,
      confirmPassword: signupData.confirmPassword,
      acceptTerms: signupData.acceptTerms,
      ip: ip ?? null,
      userAgent,
      appOrigin: requestOrigin ?? getAppOrigin(),
    });

    if (!edgeResult.ok) {
      return { ok: false, message: edgeResult.message };
    }

    if (edgeResult.accessToken && edgeResult.refreshToken) {
      const supabase = await createServerClient();
      const { error } = await supabase.auth.setSession({
        access_token: edgeResult.accessToken,
        refresh_token: edgeResult.refreshToken,
      });

      if (error) {
        return {
          ok: true,
          message: "Conta criada com sucesso. Entre com e-mail e senha para acessar o sistema.",
          needsEmailConfirmation: edgeResult.needsEmailConfirmation,
          needsLogin: true,
        };
      }
    }

    return {
      ok: true,
      needsEmailConfirmation: edgeResult.needsEmailConfirmation,
      needsLogin: Boolean(edgeResult.needsEmailConfirmation),
      message: edgeResult.message,
    };
  }

  try {
    await assertSignupRateLimits({ email, ip: ip ?? null });

    try {
      if (await emailAlreadyRegistered(email)) {
        return {
          ok: false,
          message: "Este e-mail já possui cadastro. Faça login.",
        };
      }
    } catch (error) {
      if (isInvalidJwtLikeError(error)) {
        return await runLegacySignupFlow();
      }
      throw error;
    }

    const appOrigin = requestOrigin ?? getAppOrigin();
    let existingPending;
    try {
      existingPending = await findPendingSignupVerification(email);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? "");
      if (message.includes("signup_verification_tokens")) {
        return {
          ok: false,
          message:
            "Cadastro bloqueado: tabela de verificação ainda não está disponível no schema cache do Supabase. Execute a migration 0015 e recarregue o cache.",
        };
      }
      if (isInvalidJwtLikeError(error)) {
        return await runLegacySignupFlow();
      }
      throw error;
    }

    if (existingPending) {
      if (!existingPending.user_id) {
        throw new Error("Cadastro pendente incompleto. Solicite um novo link.");
      }

      await issueSignupVerification({
        email,
        nome,
        empresaNome,
        userId: existingPending.user_id,
        appOrigin,
      });

      return {
        ok: true,
        message:
          "Enviamos novamente o link único de confirmação para seu e-mail. Ele expira em 30 minutos.",
        needsEmailConfirmation: true,
        needsLogin: true,
      };
    }

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        nome,
        empresa_nome: empresaNome,
      },
    });

    if (createUserError || !createdUser.user?.id) {
      if (isInvalidJwtLikeError(createUserError)) {
        return await runLegacySignupFlow();
      }
      throw new Error(createUserError?.message ?? "Não foi possível criar o usuário.");
    }

    createdUserId = createdUser.user.id;

    await issueSignupVerification({
      email,
      nome,
      empresaNome,
      userId: createdUserId,
      appOrigin,
    });

    return {
      ok: true,
      needsEmailConfirmation: true,
      needsLogin: true,
      message: `Conta criada! Enviamos um link único para seu e-mail. Ele expira em 30 minutos.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar conta";
    
    if (isInvalidJwtLikeError(error)) {
      return await runLegacySignupFlow();
    }

    if (createdUserId) {
      const cleanupResults = await Promise.allSettled([
        deleteSignupVerificationByEmail(email),
        admin.auth.admin.deleteUser(createdUserId),
      ]);
      const cleanupErrors = cleanupResults
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

      if (cleanupErrors.length > 0) {
        await createSecurityAlert({
          category: "signup",
          severity: "medium",
          reason: "signup_cleanup_error",
          email,
          ip: ip ?? null,
          metadata: {
            cleanupErrors,
          },
        });
      }
    }
    await createSecurityAlert({
      category: "signup",
      severity: "medium",
      reason: "signup_flow_error",
      email,
      ip: ip ?? null,
      metadata: {
        error: message,
        userAgent,
      },
    });
    return { ok: false, message };
  }
}
