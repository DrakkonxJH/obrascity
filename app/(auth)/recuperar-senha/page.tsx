import { RecoveryForm } from "./recovery-form";

export default function RecuperarSenhaPage() {
  return (
    <section className="of-login-v2-layout">
      <div className="of-login-v2-left">
        <p className="of-login-v2-kicker">{"// RECUPERAÇÃO DE ACESSO"}</p>
        <h1 className="of-login-v2-title">
          RECUPERE
          <br />
          O ACESSO
          <br />
          DA SUA
          <br />
          CONTA
        </h1>
        <p className="of-login-v2-subtitle">
          Enviaremos um link seguro para redefinir sua senha.
        </p>
      </div>

      <aside className="of-login-v2-card">
        <div className="of-login-v2-brand">
          <span className="of-login-v2-brand-icon">🏗</span>
          <span className="of-login-v2-brand-text">
            PLAN<span>OBRAS</span>
          </span>
        </div>
        <h2 className="of-login-v2-card-title">Recuperar senha</h2>
        <p className="of-login-v2-card-subtitle">
          Informe o e-mail cadastrado para receber o link.
        </p>
        <RecoveryForm />
      </aside>
    </section>
  );
}
