import { createServerClient } from "@/lib/supabase/server";

function isInvalidAuthSessionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /invalid jwt|jwt|auth session/i.test(message);
}

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isInvalidAuthSessionError(error)) {
      return null;
    }

    throw error;
  }

  return data.user;
}
