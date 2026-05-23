"use server";

import { createServerClient } from "@/lib/supabase/server";

export type ResetPasswordActionState = {
  ok: boolean;
  message: string;
};

export async function resetPasswordAction(
  _prev: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 10) {
    return { ok: false, message: "A nova senha deve ter no mínimo 10 caracteres." };
  }
  if (password !== confirmPassword) {
    return { ok: false, message: "As senhas não conferem." };
  }

  function isInvalidAuthSessionError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /invalid jwt|jwt|auth session/i.test(message);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isInvalidAuthSessionError(error)) {
      return {
        ok: false,
        message: "Sessão de recuperação inválida. Solicite um novo link.",
      };
    }

    throw error;
  }

  if (!data.user) {
    return {
      ok: false,
      message: "Sessão de recuperação inválida. Solicite um novo link.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  return { ok: true, message: "Senha redefinida com sucesso." };
}
