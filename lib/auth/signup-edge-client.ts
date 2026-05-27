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
  // Use the server-side proxy to avoid browser CORS restrictions.
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
