"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  sendRecoveryEmailAction,
  type RecoveryActionState,
} from "./actions";

const initialState: RecoveryActionState = {
  ok: false,
  message: "",
};

export function RecoveryForm() {
  const [state, formAction, pending] = useActionState(
    sendRecoveryEmailAction,
    initialState,
  );

  return (
    <form action={formAction} autoComplete="off" className="of-login-v2-form">
      <div className="of-login-v2-field">
        <label className="of-login-v2-label" htmlFor="email">
          E-mail da conta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="of-login-v2-input"
          placeholder="usuario@construtora.com.br"
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

      <button type="submit" disabled={pending} className="of-login-v2-submit">
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </button>

      <Link href="/login" className="of-login-v2-demo">
        Voltar para login
      </Link>
    </form>
  );
}
