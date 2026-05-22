import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSecurityAlert } from "@/lib/security/security-alerts";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
]);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1);
}

export function isDisposableEmail(email: string) {
  const domain = getEmailDomain(email);
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

export async function assertSignupRateLimits(input: {
  email: string;
  ip: string | null;
}) {
  const email = normalizeEmail(input.email);
  const ip = input.ip ?? "unknown";

  const [byIp, byEmail] = await Promise.all([
    checkRateLimit({
      key: `signup:ip:${ip}`,
      limit: 8,
      windowSeconds: 60 * 60,
    }),
    checkRateLimit({
      key: `signup:email:${email}`,
      limit: 3,
      windowSeconds: 60 * 60 * 24,
    }),
  ]);

  if (!byIp.allowed) {
    await createSecurityAlert({
      category: "signup",
      severity: "high",
      reason: "signup_rate_limit_ip",
      email,
      ip,
      metadata: {
        remaining: byIp.remaining,
        retryAfter: byIp.retryAfter,
      },
    });
    throw new Error("Muitas tentativas deste IP. Tente novamente mais tarde.");
  }

  if (!byEmail.allowed) {
    await createSecurityAlert({
      category: "signup",
      severity: "high",
      reason: "signup_rate_limit_email",
      email,
      ip,
      metadata: {
        remaining: byEmail.remaining,
        retryAfter: byEmail.retryAfter,
      },
    });
    throw new Error("Limite de tentativas para este e-mail atingido.");
  }
}

export async function logSignupAttempt(input: {
  email: string;
  ip: string | null;
  success: boolean;
  failureReason?: string;
}) {
  try {
    const admin = createAdminClient();
    const ipHash = input.ip
      ? createHash("sha256").update(input.ip).digest("hex")
      : null;

    await admin.from("signup_attempts").insert({
      email: normalizeEmail(input.email),
      ip_hash: ipHash,
      success: input.success,
      failure_reason: input.failureReason ?? null,
    });
  } catch {
    // Audit is best-effort; signup should not fail if logging fails.
  }
}

export async function emailAlreadyRegistered(email: string) {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error("Nao foi possivel validar o e-mail");
  }

  return Boolean(data?.id);
}
