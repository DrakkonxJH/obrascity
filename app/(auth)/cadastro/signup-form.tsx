"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpAction, type SignupActionState } from "./actions";

const initialState: SignupActionState = {
  ok: false,
  message: "",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (state.ok && !state.needsLogin) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  const checks = {
    minLength: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const strength =
    score <= 2 ? "fraca" : score <= 4 ? "média" : "forte";
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

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
          <div className="of-login-v2-password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={10}
              className="of-login-v2-input"
              placeholder="Mínimo 10 caracteres"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
          <div style={{ marginTop: 10, fontSize: ".82rem", color: "#9AA7C2" }}>
            <div>
              Força da senha:{" "}
              <strong
                style={{
                  color: strength === "forte" ? "#1FD07A" : strength === "média" ? "#FFD166" : "#FF6B6B",
                }}
              >
                {strength.toUpperCase()}
              </strong>
            </div>
            <div style={{ marginTop: 4 }}>A senha deve conter:</div>
            <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
              <li style={{ color: checks.minLength ? "#1FD07A" : "#9AA7C2" }}>mínimo de 10 caracteres</li>
              <li style={{ color: checks.uppercase ? "#1FD07A" : "#9AA7C2" }}>ao menos 1 letra maiúscula</li>
              <li style={{ color: checks.lowercase ? "#1FD07A" : "#9AA7C2" }}>ao menos 1 letra minúscula</li>
              <li style={{ color: checks.number ? "#1FD07A" : "#9AA7C2" }}>ao menos 1 número</li>
              <li style={{ color: checks.symbol ? "#1FD07A" : "#9AA7C2" }}>ao menos 1 caractere especial</li>
            </ul>
          </div>
        </div>

        <div className="of-login-v2-field">
          <label className="of-login-v2-label" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <div className="of-login-v2-password-wrap">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={10}
              className="of-login-v2-input"
              placeholder="Repita a senha"
              autoComplete="off"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <button
              type="button"
              className="of-login-v2-password-toggle"
              aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword((value) => !value)}
            >
              {showConfirmPassword ? (
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
          {confirmPassword.length > 0 ? (
            <p style={{ marginTop: 8, fontSize: ".82rem", color: passwordsMatch ? "#1FD07A" : "#FF6B6B" }}>
              {passwordsMatch ? "As senhas coincidem." : "As senhas não coincidem."}
            </p>
          ) : null}
        </div>

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

        {state.ok && state.needsLogin ? (
          <Link href="/login" className="of-login-v2-submit of-login-v2-submit-link">
            Ir para login
          </Link>
        ) : (
          <button
            type="submit"
            disabled={pending || !passwordsMatch || score < 5}
            className="of-login-v2-submit"
          >
            {pending ? "Criando conta..." : "Começar trial gratuito"}
          </button>
        )}
      </form>
    </>
  );
}
