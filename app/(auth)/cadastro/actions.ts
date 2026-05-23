"use server";

import { headers } from "next/headers";
import { signupSchema } from "@/lib/auth/signup-schema";
import { getAppOrigin } from "@/lib/validations/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSignupRateLimits, emailAlreadyRegistered } from "@/lib/security/signup-guard";
import {
  deleteSignupVerificationByEmail,
  findPendingSignupVerification,
  issueSignupVerification,
} from "@/lib/auth/signup-verification";
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

  const {
    nome,
    empresaNome,
    email,
    password,
  } = parsed.data;

  let createdUserId: string | null = null;
  const admin = createAdminClient();

  try {
    await assertSignupRateLimits({ email, ip: ip ?? null });

    if (await emailAlreadyRegistered(email)) {
      return {
        ok: false,
        message: "Este e-mail já possui cadastro. Faça login.",
      };
    }

    const appOrigin = requestOrigin ?? getAppOrigin();
    const existingPending = await findPendingSignupVerification(email);

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
