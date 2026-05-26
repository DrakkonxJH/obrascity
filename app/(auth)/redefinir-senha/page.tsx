import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "./reset-password-form";

export default async function RedefinirSenhaPage() {
  const user = await getCurrentUser();

  return (
    <section className="of-login-v2-layout">
      <div className="of-login-v2-left">
        <p className="of-login-v2-kicker">{"// SEGURANÇA DE ACESSO"}</p>
        <h1 className="of-login-v2-title">
          DEFINA
          <br />
          UMA NOVA
          <br />
          SENHA
          <br />
          SEGURA
        </h1>
        <p className="of-login-v2-subtitle">
          Atualize sua senha para recuperar o acesso com segurança.
        </p>
      </div>

      <aside className="of-login-v2-card">
        <div className="of-login-v2-brand">
          <span className="of-login-v2-brand-icon">🏗</span>
          <span className="of-login-v2-brand-text">
            PLAN<span>OBRAS</span>
          </span>
        </div>
        <h2 className="of-login-v2-card-title">Redefinir senha</h2>
        <p className="of-login-v2-card-subtitle">
          {user
            ? "Digite e confirme sua nova senha."
            : "Sessão de recuperação inválida ou expirada."}
        </p>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="of-login-v2-form">
            <p className="of-login-v2-error">
              Solicite um novo link para continuar a recuperação.
            </p>
            <Link href="/recuperar-senha" className="of-login-v2-submit of-login-v2-submit-link">
              Solicitar novo link
            </Link>
          </div>
        )}
      </aside>
    </section>
  );
}
