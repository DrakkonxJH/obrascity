"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeEmail } from "@/lib/security/signup-guard";
import { createSecurityAlert } from "@/lib/security/security-alerts";

export type LoginActionState = {
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

  const userId = data.user?.id;
  if (userId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Erro ao validar perfil apos login: ${profileError.message}`);
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

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  redirect(safeNext);
}
