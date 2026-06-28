import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { buildMfaChallengePath, getMfaRequirementForProfile, getPostLoginPath, sanitizeNextPath } from "@/lib/auth/mfa";
import { SetupMfaForm } from "./setup-form";

type SetupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function MfaSetupPage({ searchParams }: SetupPageProps) {
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
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2") {
    redirect(safeNext);
  }
  if (assurance?.nextLevel === "aal2") {
    redirect(buildMfaChallengePath(safeNext));
  }

  return (
    <section className="of-login-v2-layout">
      <div className="of-login-v2-left">
        <p className="of-login-v2-kicker">{"// MFA SETUP"}</p>
        <h1 className="of-login-v2-title">
          ATIVE O
          <br />
          <span>SEGUNDO FATOR</span>
          <br />
          DE ACESSO
        </h1>
        <p className="of-login-v2-subtitle">
          O acesso continua somente após vincular um autenticador TOTP à sua conta.
        </p>
      </div>

      <aside className="of-login-v2-card">
        <h2 className="of-login-v2-card-title">Cadastrar MFA</h2>
        <p className="of-login-v2-card-subtitle">
          Conta: {user.email ?? "usuário autenticado"}
        </p>
        <SetupMfaForm
          nextPath={sanitizeNextPath(safeNext)}
          isMaster={requirement.isMasterOwner}
          userEmail={user.email ?? ""}
        />
      </aside>
    </section>
  );
}
