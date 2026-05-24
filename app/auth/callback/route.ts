import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionTrialTenant } from "@/lib/auth/provision-tenant";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  const supabase = await createServerClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
      );
    }
  } else if (tokenHash && type === "signup") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
      );
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));
  }

  // Garante provisionamento do tenant trial após confirmação de e-mail no fluxo nativo do Supabase.
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (user?.id && user.email) {
    const admin = createAdminClient();
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile?.id) {
      const nome = String(user.user_metadata?.nome ?? user.email.split("@")[0] ?? "Usuário");
      const empresaNome = String(user.user_metadata?.empresa_nome ?? "Nova empresa");
      await provisionTrialTenant({
        userId: user.id,
        email: user.email,
        nome,
        empresaNome,
      });
    }
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
