"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeEmail } from "@/lib/security/signup-guard";
import { getAppOrigin } from "@/lib/validations/env";

export type RecoveryActionState = {
  ok: boolean;
  message: string;
};

export async function sendRecoveryEmailAction(
  _prev: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Informe um e-mail válido." };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

  const limit = await checkRateLimit({
    key: `password-recovery:${ip}:${email}`,
    limit: 6,
    windowSeconds: 15 * 60,
  });

  if (!limit.allowed) {
    return {
      ok: false,
      message: "Muitas tentativas. Aguarde alguns minutos para tentar novamente.",
    };
  }

  const supabase = await createServerClient();
  const redirectTo = `${getAppOrigin()}/auth/callback?next=/redefinir-senha`;
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return {
    ok: true,
    message:
      "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
  };
}
