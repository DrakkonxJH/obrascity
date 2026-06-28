"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SetupMfaFormProps = {
  nextPath: string;
  isMaster: boolean;
  userEmail: string;
};

type EnrollmentState = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export function SetupMfaForm({ nextPath, isMaster, userEmail }: SetupMfaFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);

  async function handleGenerate() {
    setPending(true);
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: existing, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        throw listError;
      }

      for (const factor of existing.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (unenrollError) {
          throw unenrollError;
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: isMaster ? "ObrasCity Master" : `ObrasCity ${userEmail || "tenant"}`,
      });
      if (error || !data?.totp) {
        throw error ?? new Error("Resposta inválida ao cadastrar fator TOTP.");
      }

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setMessage("QR Code gerado. Escaneie no autenticador e confirme com o código de 6 dígitos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar MFA.");
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment) return;

    setVerifying(true);
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollment.factorId,
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
      setMessage(error instanceof Error ? error.message : "Falha ao validar código MFA.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: 16,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <p className="of-login-v2-card-subtitle" style={{ marginBottom: 8 }}>
          1. Gere o fator TOTP
        </p>
        <button type="button" onClick={handleGenerate} disabled={pending} className="of-login-v2-submit">
          {pending ? "Gerando..." : enrollment ? "Regenerar QR code" : "Gerar QR code"}
        </button>
      </div>

      {enrollment ? (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.02)",
            display: "grid",
            gap: 12,
          }}
        >
          <p className="of-login-v2-card-subtitle" style={{ marginBottom: 0 }}>
            2. Escaneie no Google Authenticator, 1Password ou app compatível
          </p>
          <div
            style={{ background: "#fff", borderRadius: 16, padding: 12, width: "fit-content" }}
            dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
          />
          <div className="of-login-v2-field" style={{ marginBottom: 0 }}>
            <label className="of-login-v2-label" htmlFor="mfa-secret">
              Chave manual
            </label>
            <input
              id="mfa-secret"
              readOnly
              value={enrollment.secret}
              className="of-login-v2-input"
            />
          </div>
          <p className="of-login-v2-card-subtitle" style={{ fontSize: 12 }}>
            Se o QR não abrir, cadastre manualmente usando a chave acima.
          </p>
        </div>
      ) : null}

      {enrollment ? (
        <form onSubmit={handleVerify} className="of-login-v2-form" style={{ padding: 0 }}>
          <div className="of-login-v2-field">
            <label className="of-login-v2-label" htmlFor="mfa-code">
              Código do autenticador
            </label>
            <input
              id="mfa-code"
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
          {message ? <p className="of-login-v2-error">{message}</p> : null}
          <button type="submit" disabled={verifying} className="of-login-v2-submit">
            {verifying ? "Validando..." : "Concluir ativação"}
          </button>
        </form>
      ) : message ? (
        <p className="of-login-v2-error">{message}</p>
      ) : null}
    </div>
  );
}
