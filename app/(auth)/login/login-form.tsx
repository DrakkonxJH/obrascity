"use client";

import { useActionState } from "react";
import Link from "next/link";
import Script from "next/script";
import { TurnstileField } from "@/components/security/turnstile-field";
import { signInAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {
  ok: false,
  message: "",
};

type LoginFormProps = {
  nextPath?: string;
  turnstileSiteKey: string | null;
  captchaRequired: boolean;
};

export function LoginForm({ nextPath = "/dashboard", turnstileSiteKey, captchaRequired }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const captchaEnabled = Boolean(turnstileSiteKey);

  return (
    <>
      {captchaEnabled ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      ) : null}

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
          <Link href="/cadastro" className="of-login-v2-forgot">
            Esqueci a senha
          </Link>
        </div>

        {captchaEnabled ? (
          <div className="of-login-v2-field">
            <TurnstileField siteKey={turnstileSiteKey!} />
          </div>
        ) : (
          <p className="of-login-v2-help">
            {captchaRequired
              ? "Captcha obrigatorio: configure NEXT_PUBLIC_TURNSTILE_SITE_KEY."
              : "Captcha desativado em desenvolvimento. Configure TURNSTILE para producao."}
          </p>
        )}

        {state.message ? (
          <p className="of-login-v2-error">
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending || (captchaRequired && !captchaEnabled)} className="of-login-v2-submit">
          {pending ? "Entrando..." : "Entrar no sistema"}
        </button>

        <div className="of-login-v2-divider">
          <span>novo por aqui?</span>
        </div>

        <Link href="/cadastro" className="of-login-v2-demo">
          Cadastre-se
        </Link>
      </form>
    </>
  );
}
