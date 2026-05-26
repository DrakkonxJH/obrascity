import { z } from "zod";

const DEFAULT_PUBLIC_APP_URL = "https://planobras.vercel.app";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  SIGNUP_EDGE_SHARED_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  DATA_ENCRYPTION_KEY: z.string().min(1).optional(),
  CONTROLE_TOTAL_OWNER_EMAIL: z.string().email().optional(),
  CONTROLE_TOTAL_OWNER_PROFILE_ID: z.string().min(1).optional(),
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Ambiente invalido: ${parsed.error.message}`);
  }

  if (process.env.NODE_ENV === "production" && !parsed.data.DATA_ENCRYPTION_KEY) {
    throw new Error("DATA_ENCRYPTION_KEY obrigatoria em producao");
  }

  if (process.env.NODE_ENV === "production" && !parsed.data.NEXT_PUBLIC_APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL obrigatoria em producao");
  }

  return parsed.data;
}

export function getAppOrigin() {
  const env = getEnv();
  return resolvePublicAppOrigin(env.NEXT_PUBLIC_APP_URL);
}

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";

    if (process.env.NODE_ENV === "production" && isLocalHost) {
      return null;
    }

    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function isVercelDomain(origin: string): boolean {
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function resolvePublicAppOrigin(requestOrigin?: string | null): string {
  const env = getEnv();

  const request = normalizeOrigin(requestOrigin);
  const envOrigin = normalizeOrigin(env.NEXT_PUBLIC_APP_URL ?? null);

  if (request && envOrigin) {
    // If both are Vercel-hosted, prefer current request host to avoid callback redirects
    // to a non-active alias/domain during domain migration.
    if (isVercelDomain(request) && isVercelDomain(envOrigin)) {
      return request;
    }
    return envOrigin;
  }

  if (request) return request;
  if (envOrigin) return envOrigin;

  return process.env.NODE_ENV === "production" ? DEFAULT_PUBLIC_APP_URL : "http://localhost:3000";
}
