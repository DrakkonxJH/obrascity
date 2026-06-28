import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { getMfaRequirementForProfile, getPostLoginPath } from "@/lib/auth/mfa";
import { ChallengeMfaForm } from "./challenge-form";

type ChallengePageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function MfaChallengePage({ searchParams }: ChallengePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const requirement = await getMfaRequirementForProfile(profile);
  const safeNext = getPostLoginPath(requirement.isMasterOwner, params.next);

  if (!requirement.required) {
    redirect(safeNext);
  }

  const supabase = await createServerClient();
  const [{ data: assurance }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  if (assurance?.currentLevel === "aal2") {
    redirect(safeNext);
  }
  if (assurance?.nextLevel !== "aal2") {
    redirect(`/mfa/setup?next=${encodeURIComponent(safeNext)}`);
  }

  return (
    <section className="of-login-v2-layout">
      <div className="of-login-v2-left">
        <p className="of-login-v2-kicker">{"// MFA CHALLENGE"}</p>
        <h1 className="of-login-v2-title">
          CONFIRME
          <br />
          <span>SEU ACESSO</span>
          <br />
          AGORA
        </h1>
        <p className="of-login-v2-subtitle">
          A senha foi validada. Falta apenas confirmar o código do autenticador para liberar a sessão.
        </p>
      </div>

      <aside className="of-login-v2-card">
        <h2 className="of-login-v2-card-title">Verificar MFA</h2>
        <p className="of-login-v2-card-subtitle">
          Conta: {user.email ?? "usuário autenticado"}
        </p>
        <ChallengeMfaForm nextPath={safeNext} availableTotpFactors={factors?.totp ?? []} />
      </aside>
    </section>
  );
}
