"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/auth/signup-schema";
import { getAppOrigin, getEnv } from "@/lib/validations/env";
import { invokeSignupEdgeFunction } from "@/lib/auth/signup-edge-client";

export type SignupActionState = {
  ok: boolean;
  message: string;
  needsEmailConfirmation?: boolean;
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

  const parsed = signupSchema.safeParse({
    nome: formData.get("nome"),
    empresaNome: formData.get("empresaNome"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    captchaToken:
      formData.get("captchaToken") ?? formData.get("cf-turnstile-response"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados invalidos";
    return { ok: false, message };
  }

  const {
    nome,
    empresaNome,
    email,
    password,
    confirmPassword,
    captchaToken,
    acceptTerms,
  } = parsed.data;
  const env = getEnv();
  const captchaEnabled = Boolean(
    env.TURNSTILE_SECRET_KEY?.trim() && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );

  try {
    const edgeResult = await invokeSignupEdgeFunction({
      nome,
      empresaNome,
      email,
      password,
      confirmPassword,
      captchaToken,
      captchaEnabled,
      acceptTerms,
      ip,
      userAgent,
      appOrigin: getAppOrigin(),
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
          ok: false,
          message: `Conta criada, mas não foi possivel abrir sessao automaticamente: ${error.message}`,
          needsEmailConfirmation: edgeResult.needsEmailConfirmation,
        };
      }
    }

    return {
      ok: true,
      needsEmailConfirmation: edgeResult.needsEmailConfirmation,
      message: edgeResult.message,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar conta";
    return { ok: false, message };
  }
}
