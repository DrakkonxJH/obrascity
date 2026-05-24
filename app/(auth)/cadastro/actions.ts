"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/auth/signup-schema";
import { getAppOrigin, getEnv } from "@/lib/validations/env";
import { assertSignupRateLimits, emailAlreadyRegistered, logSignupAttempt } from "@/lib/security/signup-guard";
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

  const { nome, empresaNome, email, password } = signupData;

  function isInvalidJwtLikeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /invalid jwt|jwt|auth session/i.test(message);
  }

  try {
    await assertSignupRateLimits({ email, ip: ip ?? null });

    if (await emailAlreadyRegistered(email)) {
      await logSignupAttempt({
        email,
        ip: ip ?? null,
        success: false,
        failureReason: "email_already_registered",
      });
      return {
        ok: false,
        message: "Este e-mail já possui cadastro. Faça login.",
      };
    }

    const supabase = await createServerClient();
    const appOrigin = requestOrigin ?? getAppOrigin();
    const env = getEnv();
    const redirectBase = env.NEXT_PUBLIC_APP_URL ?? appOrigin;
    const redirectTo = `${redirectBase.replace(/\/$/, "")}/auth/callback`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          nome,
          empresa_nome: empresaNome,
          signup_source: "obrasflow_web",
        },
      },
    });

    if (signUpError) {
      await logSignupAttempt({
        email,
        ip: ip ?? null,
        success: false,
        failureReason: signUpError.message || "signup_provider_error",
      });
      if (isInvalidJwtLikeError(signUpError)) {
        return {
          ok: false,
          message: "Erro de autenticação com Supabase. Verifique as credenciais do projeto.",
        };
      }
      throw new Error(signUpError.message || "Não foi possível criar o usuário.");
    }

    await logSignupAttempt({
      email,
      ip: ip ?? null,
      success: true,
    });

    return {
      ok: true,
      needsEmailConfirmation: !signUpData.session,
      needsLogin: true,
      message: signUpData.session
        ? "Conta criada com sucesso! Entre com e-mail e senha para acessar o sistema."
        : "Conta criada! Enviamos o e-mail de confirmação pelo Supabase. Verifique sua caixa de entrada.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar conta";
    await logSignupAttempt({
      email,
      ip: ip ?? null,
      success: false,
      failureReason: message,
    });

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
