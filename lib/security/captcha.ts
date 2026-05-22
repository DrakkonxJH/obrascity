import { getEnv } from "@/lib/validations/env";

type TurnstileResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  cdata?: string;
  "error-codes"?: string[];
};

type VerifyTurnstileTokenInput = {
  token: string | null | undefined;
  remoteIp?: string | null;
  expectedHostname?: string | null;
  expectedAction?: string;
};

function normalizeHost(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function getAllowedHostnames(rawAllowed: string | undefined, appUrl: string | undefined) {
  const hostnames = new Set<string>();
  const fromEnv = rawAllowed
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  for (const hostname of fromEnv ?? []) {
    hostnames.add(hostname);
  }

  if (appUrl) {
    hostnames.add(new URL(appUrl).hostname.toLowerCase());
  }

  return hostnames;
}

export async function verifyTurnstileToken({
  token,
  remoteIp,
  expectedHostname,
  expectedAction,
}: VerifyTurnstileTokenInput) {
  const env = getEnv();
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const normalizedIp = remoteIp?.trim();
  const normalizedExpectedHostname = normalizeHost(expectedHostname);
  const allowedHostnames = getAllowedHostnames(env.TURNSTILE_ALLOWED_HOSTNAMES, env.NEXT_PUBLIC_APP_URL);

  if (!secret || !siteKey) {
    return { ok: true as const };
  }

  if (!token?.trim()) {
    return { ok: false as const, reason: "Captcha obrigatorio" };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  if (normalizedIp && normalizedIp !== "unknown") {
    body.set("remoteip", normalizedIp);
  }

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
    const codes = data["error-codes"]?.filter(Boolean) ?? [];
    const codeLabel = codes.length > 0 ? ` (${codes.join(", ")})` : "";
    return { ok: false as const, reason: `Captcha invalido${codeLabel}` };
  }

  const hostname = normalizeHost(data.hostname);
  if (!hostname) {
    return { ok: false as const, reason: "Captcha invalido (hostname ausente)" };
  }

  if (normalizedExpectedHostname && hostname !== normalizedExpectedHostname) {
    return {
      ok: false as const,
      reason: `Captcha invalido (hostname inesperado: ${hostname})`,
    };
  }

  if (allowedHostnames.size > 0 && !allowedHostnames.has(hostname)) {
    return {
      ok: false as const,
      reason: `Captcha invalido (hostname não permitido: ${hostname})`,
    };
  }

  if (expectedAction && data.action && data.action !== expectedAction) {
    return {
      ok: false as const,
      reason: `Captcha invalido (action inesperada: ${data.action})`,
    };
  }

  return { ok: true as const };
}
