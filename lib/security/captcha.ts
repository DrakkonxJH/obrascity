import { getEnv } from "@/lib/validations/env";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token: string | null | undefined) {
  const env = getEnv();
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  if (!secret || !siteKey) {
    return { ok: true as const };
  }

  if (!token?.trim()) {
    return { ok: false as const, reason: "Captcha obrigatorio" };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return { ok: false as const, reason: "Falha ao validar captcha" };
  }

  const data = (await response.json()) as TurnstileResponse;
  if (!data.success) {
    return { ok: false as const, reason: "Captcha invalido" };
  }

  return { ok: true as const };
}
