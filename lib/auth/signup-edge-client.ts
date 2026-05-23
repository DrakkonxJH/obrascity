import { getEnv } from "@/lib/validations/env";

export type SignupEdgePayload = {
  nome: string;
  empresaNome: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: "on";
  ip: string | null;
  userAgent: string | null;
  appOrigin: string;
};

export type SignupEdgeResult = {
  ok: boolean;
  message: string;
  needsEmailConfirmation?: boolean;
  accessToken?: string;
  refreshToken?: string;
};

export async function invokeSignupEdgeFunction(payload: SignupEdgePayload): Promise<SignupEdgeResult> {
  const env = getEnv();
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables not configured");
  }

  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signup-orchestrator`;
  const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isJwtLikeKey = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(isJwtLikeKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : {}),
      apikey: apiKey,
      ...(env.SIGNUP_EDGE_SHARED_SECRET
        ? {
            "x-signup-edge-secret": env.SIGNUP_EDGE_SHARED_SECRET,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  let body: SignupEdgeResult;
  try {
    body = (await response.json()) as SignupEdgeResult;
  } catch {
    throw new Error("Resposta inválida da Edge Function de cadastro");
  }

  if (!response.ok) {
    return {
      ok: false,
      message: body.message || "Falha ao processar cadastro",
    };
  }

  return body;
}
