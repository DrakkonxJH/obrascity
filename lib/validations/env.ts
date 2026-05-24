import { z } from "zod";

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
  CRM_MODE: z.enum(["native", "wekan_proxy"]).optional(),
  CRM_INTERNAL_URL: z.string().url().optional(),
  CRM_PROXY_SHARED_SECRET: z.string().min(16).optional(),
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
  return env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getCrmMode() {
  const env = getEnv();
  const mode = env.CRM_MODE ?? "wekan_proxy";
  if (mode === "wekan_proxy" && !env.CRM_INTERNAL_URL) {
    return "native";
  }
  return mode;
}

export function isCrmProxyConfigured() {
  const env = getEnv();
  return Boolean(env.CRM_INTERNAL_URL);
}
