"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resendConfirmationAction,
  signInAction,
  startSsoLoginAction,
  type LoginActionState,
  type ResendConfirmationState,
  type SsoLoginState,
} from "./actions";

const initialState: LoginActionState = {
  ok: false,
  message: "",
};
const initialResendState: ResendConfirmationState = {
  ok: false,
  message: "",
};
const initialSsoState: SsoLoginState = {
  ok: false,
  message: "",
};

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath = "/dashboard" }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationAction,
    initialResendState,
  );
  const [ssoState, ssoAction, ssoPending] = useActionState(startSsoLoginAction, initialSsoState);

  return (
    <>
      <form action={formAction} autoComplete="off" className="of-login-v2-form">
        <input type="hidden" name="next" value={nextPath} />
        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue=""
            required
            className="of-login-v2-input"
            placeholder="usuário@construtora.com.br"
          />
        </div>
        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="off"
            defaultValue=""
            required
            className="of-login-v2-input"
            placeholder="********"
          />
        </div>

        <div className="of-login-v2-row">
          <label className="of-login-v2-check">
            <input type="checkbox" name="remember" />
            <span>Manter sessão ativa</span>
          </label>
          <Link href="/recuperar-senha" className="of-login-v2-forgot">
            Esqueci a senha
          </Link>
        </div>

        {state.message ? (
          <p className="of-login-v2-error">
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="of-login-v2-submit">
          {pending ? "Entrando..." : "Entrar no sistema"}
        </button>

        <div className="of-login-v2-divider">
          <span>novo por aqui?</span>
        </div>

        <Link href="/cadastro" className="of-login-v2-demo">
          Cadastre-se
        </Link>
      </form>

      <form action={resendAction} autoComplete="off" className="of-login-v2-form mt-4">
        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="resend-email">
            Reenviar confirmação de e-mail
          </label>
          <input
            id="resend-email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue=""
            required
            className="of-login-v2-input"
            placeholder="seu-email@empresa.com.br"
          />
        </div>

        {resendState.message ? (
          <p
            className={
              resendState.ok
                ? "of-login-v2-message of-login-v2-message-success"
                : "of-login-v2-error"
            }
          >
            {resendState.message}
          </p>
        ) : null}

        <button type="submit" disabled={resendPending} className="of-login-v2-demo">
          {resendPending ? "Reenviando..." : "Reenviar confirmação"}
        </button>
      </form>

      <form action={ssoAction} autoComplete="off" className="of-login-v2-form mt-4">
        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="sso-email">
            Entrar com SSO corporativo
          </label>
          <input
            id="sso-email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue=""
            required
            className="of-login-v2-input"
            placeholder="email@empresa.com.br"
          />
        </div>
        {ssoState.message ? (
          <p className={ssoState.ok ? "of-login-v2-message of-login-v2-message-success" : "of-login-v2-error"}>
            {ssoState.message}
          </p>
        ) : null}
        <button type="submit" disabled={ssoPending} className="of-login-v2-demo">
          {ssoPending ? "Iniciando..." : "Acessar com SSO"}
        </button>
      </form>
    </>
  );
}
