import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/validations/env";

const VERIFICATION_TTL_MINUTES = 30;

export type SignupVerificationRequest = {
  email: string;
  nome: string;
  empresaNome: string;
  userId: string | null;
};

export type SignupVerificationRecord = {
  email: string;
  user_id: string | null;
  nome: string;
  empresa_nome: string;
};

export type ClaimedSignupVerification = {
  email: string;
  user_id: string;
  nome: string;
  empresa_nome: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createVerificationToken() {
  return randomBytes(32).toString("base64url");
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildVerificationUrl(appOrigin: string, token: string) {
  const url = new URL("/auth/verificar-email", appOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendVerificationEmail(input: {
  email: string;
  nome: string;
  empresaNome: string;
  verificationUrl: string;
}) {
  const env = getEnv();
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada");
  }

  const from = env.RESEND_FROM_EMAIL ?? "ObrasFlow <no-reply@obrasflow.com>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Confirme seu e-mail para ativar sua conta ObrasFlow",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Olá, ${input.nome}</h2>
          <p>Sua conta trial da <strong>${input.empresaNome}</strong> foi criada.</p>
          <p>Para concluir o cadastro, clique no botão abaixo. O link é único, expira em 30 minutos e só pode ser usado uma vez.</p>
          <p>
            <a href="${input.verificationUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#ff9445;color:#fff;text-decoration:none;font-weight:700">
              Confirmar e-mail
            </a>
          </p>
          <p>Se você não solicitou este cadastro, ignore este e-mail.</p>
        </div>
      `,
      text: [
        `Olá, ${input.nome}`,
        `Sua conta trial da ${input.empresaNome} foi criada.`,
        `Confirme seu e-mail neste link (único, uso único e válido por 30 minutos):`,
        input.verificationUrl,
      ].join("\n\n"),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail de verificação: ${body}`);
  }
}

export async function claimSignupVerificationToken(token: string) {
  const admin = createAdminClient();
  const tokenHash = hashVerificationToken(token);
  const { data, error } = await admin.rpc("claim_signup_verification_token", {
    p_token_hash: tokenHash,
  });

  if (error) {
    throw new Error(`Erro ao validar token de verificação: ${error.message}`);
  }

  const row = Array.isArray(data) ? (data[0] as ClaimedSignupVerification | undefined) : null;
  if (!row?.user_id || !row.email) {
    return null;
  }

  return row;
}

export async function completeSignupVerificationToken(token: string) {
  const admin = createAdminClient();
  const tokenHash = hashVerificationToken(token);
  const { error } = await admin.rpc("complete_signup_verification_token", {
    p_token_hash: tokenHash,
  });

  if (error) {
    throw new Error(`Erro ao concluir verificação: ${error.message}`);
  }
}

export async function deleteSignupVerificationByEmail(email: string) {
  const admin = createAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const { error } = await admin.from("signup_verification_tokens").delete().eq("email", normalizedEmail);

  if (error) {
    throw new Error(`Erro ao limpar verificação pendente: ${error.message}`);
  }
}

export async function issueSignupVerification(input: SignupVerificationRequest & { appOrigin: string }) {
  const admin = createAdminClient();
  if (!input.userId) {
    throw new Error("Usuário de verificação ausente");
  }
  const email = normalizeEmail(input.email);
  const token = createVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin.from("signup_verification_tokens").upsert(
    {
      email,
      user_id: input.userId,
      nome: input.nome,
      empresa_nome: input.empresaNome,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used_at: null,
      claimed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    throw new Error(`Erro ao registrar verificação: ${error.message}`);
  }

  await sendVerificationEmail({
    email,
    nome: input.nome,
    empresaNome: input.empresaNome,
    verificationUrl: buildVerificationUrl(input.appOrigin, token),
  });

  return { token, expiresAt };
}

export async function findPendingSignupVerification(email: string) {
  const admin = createAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await admin
    .from("signup_verification_tokens")
    .select("email, user_id, nome, empresa_nome")
    .eq("email", normalizedEmail)
    .is("used_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao consultar verificação pendente: ${error.message}`);
  }

  return (data as SignupVerificationRecord | null) ?? null;
}
