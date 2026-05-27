import { LoginForm } from "../login/login-form";

export default function MasterLoginPage() {
  return (
    <section className="of-login-v2-layout">
      <div className="of-login-v2-left">
        <p className="of-login-v2-kicker">{"// CONSOLE MASTER"}</p>
        <h1 className="of-login-v2-title">
          BACK-OFFICE
          <br />
          <span>SUPORTE</span>
          <br />
          E CONTROLE
        </h1>
        <p className="of-login-v2-subtitle">
          Acesso exclusivo para suporte, operação e governança da plataforma.
        </p>
      </div>

      <aside className="of-login-v2-card">
        <div className="of-login-v2-brand">
          <span className="of-login-v2-brand-icon">🧰</span>
          <span className="of-login-v2-brand-text">
            OBRAS<span>CITY</span>
          </span>
        </div>
        <h2 className="of-login-v2-card-title">Acesso Master</h2>
        <p className="of-login-v2-card-subtitle">Somente a conta de suporte e gerenciamento</p>
        <LoginForm nextPath="/contas" />
      </aside>
    </section>
  );
}
