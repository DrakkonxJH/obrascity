"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "./actions";

const initialState: ResetPasswordActionState = {
  ok: false,
  message: "",
};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} autoComplete="off" className="of-login-v2-form">
      <div className="of-login-v2-field">
        <label className="of-login-v2-label" htmlFor="password">
          Nova senha
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
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          className="of-login-v2-input"
          placeholder="Repita a nova senha"
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {state.message ? (
        <p
          className={
            state.ok
              ? "of-login-v2-message of-login-v2-message-success"
              : "of-login-v2-error"
          }
        >
          {state.message}
        </p>
      ) : null}

      {state.ok ? (
        <Link href="/login" className="of-login-v2-submit of-login-v2-submit-link">
          Ir para login
        </Link>
      ) : (
        <button type="submit" disabled={pending} className="of-login-v2-submit">
          {pending ? "Atualizando..." : "Salvar nova senha"}
        </button>
      )}
    </form>
  );
}
