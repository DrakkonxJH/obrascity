"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TurnstileField } from "@/components/security/turnstile-field";
import { signUpAction, type SignupActionState } from "./actions";

const initialState: SignupActionState = {
  ok: false,
  message: "",
};

type SignupFormProps = {
  turnstileSiteKey: string | null;
  captchaRequired: boolean;
};

export function SignupForm({ turnstileSiteKey, captchaRequired }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const router = useRouter();
  const captchaEnabled = Boolean(turnstileSiteKey);

  useEffect(() => {
    if (state.ok && !state.needsEmailConfirmation) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <form action={formAction} autoComplete="off" className="of-login-v2-form">
        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="nome">
            Seu nome
          </label>
          <input
            id="nome"
            name="nome"
            required
            className="of-login-v2-input"
            placeholder="Maria Silva"
            autoComplete="name"
          />
        </div>

        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="empresaNome">
            Nome da empresa
          </label>
          <input
            id="empresaNome"
            name="empresaNome"
            required
            className="of-login-v2-input"
            placeholder="Construtora Exemplo Ltda."
            autoComplete="organization"
          />
        </div>

        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="of-login-v2-input"
            placeholder="voce@empresa.com.br"
            autoComplete="off"
            defaultValue=""
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
            required
            minLength={10}
            className="of-login-v2-input"
            placeholder="Mínimo 10 caracteres"
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={10}
            className="of-login-v2-input"
            placeholder="Repita a senha"
            autoComplete="off"
            defaultValue=""
          />
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

        <label className="of-login-v2-check of-login-v2-check-start">
          <input type="checkbox" name="acceptTerms" value="on" required />
          <span>
            Aceito os{" "}
            <Link href="/termos" className="of-login-v2-inline-link">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="of-login-v2-inline-link">
              política de privacidade (LGPD)
            </Link>
            . Trial gratuito por 14 dias.
          </span>
        </label>

        {state.message ? (
          <p
            className={`of-login-v2-message ${
              state.ok
                ? "of-login-v2-message-success"
                : "of-login-v2-error"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        {state.ok && state.needsEmailConfirmation ? (
          <Link href="/login" className="of-login-v2-submit of-login-v2-submit-link">
            Ir para login
          </Link>
        ) : (
          <button
            type="submit"
            disabled={pending || (captchaRequired && !captchaEnabled)}
            className="of-login-v2-submit"
          >
            {pending ? "Criando conta..." : "Começar trial gratuito"}
          </button>
        )}
      </form>
    </>
  );
}
