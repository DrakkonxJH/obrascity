"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Factor } from "@supabase/auth-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ChallengeMfaFormProps = {
  nextPath: string;
  availableTotpFactors: Factor<"totp", "verified">[];
};

export function ChallengeMfaForm({ nextPath, availableTotpFactors }: ChallengeMfaFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const primaryFactor = availableTotpFactors[0] ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!primaryFactor) return;

    setPending(true);
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: primaryFactor.id,
        code: code.trim(),
      });
      if (error) {
        throw error;
      }

      const finalize = await fetch("/api/auth/mfa/finalize", {
        method: "POST",
        credentials: "include",
      });
      if (!finalize.ok) {
        const payload = (await finalize.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Falha ao finalizar a sessão autenticada.");
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao confirmar MFA.");
    } finally {
      setPending(false);
    }
  }

  if (!primaryFactor) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <p className="of-login-v2-error">
          Nenhum fator TOTP verificado foi encontrado para esta conta.
        </p>
        <Link href={`/mfa/setup?next=${encodeURIComponent(nextPath)}`} className="of-login-v2-submit">
          Cadastrar MFA agora
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="of-login-v2-form" style={{ padding: 0 }}>
      <div className="of-login-v2-field">
        <label className="of-login-v2-label" htmlFor="challenge-code">
          Código de 6 dígitos
        </label>
        <input
          id="challenge-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          className="of-login-v2-input"
          placeholder="123456"
        />
      </div>

      <p className="of-login-v2-card-subtitle" style={{ marginTop: -4 }}>
        Fator: {primaryFactor.friendly_name ?? "Aplicativo autenticador"}
      </p>
      {message ? <p className="of-login-v2-error">{message}</p> : null}
      <button type="submit" disabled={pending} className="of-login-v2-submit">
        {pending ? "Verificando..." : "Liberar acesso"}
      </button>
    </form>
  );
}
