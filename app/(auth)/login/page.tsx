import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
  const captchaRequired = Boolean(turnstileSiteKey && process.env.TURNSTILE_SECRET_KEY);

  return (
    <section className="of-login-v2-layout">
        <div className="of-login-v2-left">
          <p className="of-login-v2-kicker">{"// SISTEMA DE GESTÃO DE OBRAS V2.4"}</p>
          <h1 className="of-login-v2-title">
            CONSTRUA
            <br />
            COM <span>PRECISÃO</span>
            <br />
            ENTREGUE
            <br />
            NO PRAZO
          </h1>
          <p className="of-login-v2-subtitle">
            Plataforma de controle total para engenheiros e gestores que não aceitam improvisação.
          </p>
        </div>

        <aside className="of-login-v2-card">
          <div className="of-login-v2-brand">
            <span className="of-login-v2-brand-icon">🏗</span>
            <span className="of-login-v2-brand-text">
              OBRAS<span>FLOW</span>
            </span>
          </div>
          <h2 className="of-login-v2-card-title">Acesso ao Sistema</h2>
          <p className="of-login-v2-card-subtitle">Credenciais corporativas requeridas</p>
          <LoginForm nextPath={nextPath} turnstileSiteKey={turnstileSiteKey} captchaRequired={captchaRequired} />
        </aside>
      </section>
  );
}
