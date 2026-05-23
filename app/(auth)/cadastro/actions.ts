"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/auth/signup-schema";
import { getAppOrigin } from "@/lib/validations/env";
import { invokeSignupEdgeFunction } from "@/lib/auth/signup-edge-client";

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

  const {
    nome,
    empresaNome,
    email,
    password,
    confirmPassword,
    acceptTerms,
  } = parsed.data;

  try {
    const edgeResult = await invokeSignupEdgeFunction({
      nome,
      empresaNome,
      email,
      password,
      confirmPassword,
      acceptTerms,
      ip,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar conta";
    return { ok: false, message };
  }
}
