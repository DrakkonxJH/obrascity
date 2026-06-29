"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  signInAction,
  type LoginActionState,
} from "./actions";

const initialState: LoginActionState = {
  ok: false,
  message: "",
};
type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath = "/dashboard" }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Garante que o Turnstile seja renderizado mesmo após navegação via cliente
    const renderCaptcha = () => {
      if (window.turnstile) {
        window.turnstile.render(".cf-turnstile");
      }
    };

    // Pequeno delay para garantir que o DOM esteja pronto e o script carregado
    const timer = setTimeout(renderCaptcha, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => {
            if (window.turnstile) window.turnstile.render(".cf-turnstile");
        }}
      />
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
          <div className="of-login-v2-password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              defaultValue=""
              required
              className="of-login-v2-input"
            placeholder="********"
            />
            <button
              type="button"
              className="of-login-v2-password-toggle"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z" />
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M3 3l18 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              )}
            </button>
          </div>
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

        <div className="of-login-v2-turnstile" style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
          <div
            className="cf-turnstile"
            data-sitekey="0x4AAAAAADTbHch1sDHIMVHq"
            data-theme="dark"
          ></div>
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
    </>
  );
}