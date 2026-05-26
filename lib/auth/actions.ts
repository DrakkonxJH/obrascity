"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export async function signOut() {
  const supabase = await createServerClient();
  const profile = await getCurrentProfile();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("of_tenant_session")?.value ?? null;
  if (profile?.empresa_id && sessionId) {
    const revoke = await supabase
      .from("tenant_auth_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("empresa_id", profile.empresa_id)
      .eq("id", sessionId)
      .is("revoked_at", null);
    if (revoke.error) {
      const message = revoke.error.message.toLowerCase();
      if (
        message.includes("tenant_auth_sessions") &&
        (message.includes("does not exist") || message.includes("could not find the table"))
      ) {
        cookieStore.delete("of_tenant_session");
        await supabase.auth.signOut();
        redirect("/login");
      }
      throw new Error(`Erro ao revogar sessão corrente: ${revoke.error.message}`);
    }
  }
  cookieStore.delete("of_tenant_session");
  await supabase.auth.signOut();
  redirect("/login");
}
