import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.0";

type SignupPayload = {
  nome?: unknown;
  empresaNome?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  acceptTerms?: unknown;
  ip?: unknown;
  userAgent?: unknown;
  appOrigin?: unknown;
};

type SignupResponse = {
  ok: boolean;
  message: string;
  needsEmailConfirmation?: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  empresaId?: string;
};

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signup-edge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: SignupResponse) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getEmailDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1);
}

function isDisposableEmail(email: string) {
  const domain = getEmailDomain(email);
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function isStrongPassword(password: string) {
  return (
    password.length >= 10 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function parsePayload(value: unknown): { ok: true; data: Required<SignupPayload> } | { ok: false; reason: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, reason: "Payload inválido." };
  }

  const payload = value as SignupPayload;
  const nome = String(payload.nome ?? "").trim();
  const empresaNome = String(payload.empresaNome ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const password = String(payload.password ?? "");
  const confirmPassword = String(payload.confirmPassword ?? "");
  const acceptTerms = String(payload.acceptTerms ?? "");
  const ip = String(payload.ip ?? "").trim();
  const userAgent = String(payload.userAgent ?? "").trim();
  const appOrigin = String(payload.appOrigin ?? "").trim();

  if (nome.length < 2 || nome.length > 120) {
    return { ok: false, reason: "Informe seu nome." };
  }
  if (empresaNome.length < 2 || empresaNome.length > 160) {
    return { ok: false, reason: "Informe o nome da empresa." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, reason: "E-mail inválido." };
  }
  if (!isStrongPassword(password)) {
    return {
      ok: false,
      reason: "Senha fraca. Use ao menos 10 caracteres, com maiúscula, minúscula, número e símbolo.",
    };
  }
  if (password !== confirmPassword) {
    return { ok: false, reason: "As senhas não conferem." };
  }
  if (acceptTerms !== "on") {
    return { ok: false, reason: "Aceite os termos para continuar." };
  }
  if (!appOrigin) {
    return { ok: false, reason: "Origem da aplicação inválida." };
  }
  try {
    const parsedOrigin = new URL(appOrigin);
    if (!/^https?:$/.test(parsedOrigin.protocol) || !parsedOrigin.hostname) {
      return { ok: false, reason: "Origem da aplicação inválida." };
    }
  } catch {
    return { ok: false, reason: "Origem da aplicação inválida." };
  }

  return {
    ok: true,
    data: {
      nome,
      empresaNome,
      email,
      password,
      confirmPassword,
      acceptTerms,
      ip,
      userAgent,
      appOrigin,
    },
  };
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json(405, { ok: false, message: "Método não permitido." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const edgeSecret = Deno.env.get("SIGNUP_EDGE_SHARED_SECRET");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { ok: false, message: "Configuração do backend incompleta." });
  }

  if (edgeSecret) {
    const requestSecret = request.headers.get("x-signup-edge-secret");
    if (requestSecret !== edgeSecret) {
      return json(401, { ok: false, message: "Solicitação não autorizada." });
    }
  }

  const payloadResult = parsePayload(await request.json());
  if (!payloadResult.ok) {
    return json(400, { ok: false, message: payloadResult.reason });
  }

  const payload = payloadResult.data;
  const email = normalizeEmail(payload.email);
  const ipHash = payload.ip ? await sha256Hex(payload.ip) : null;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const logAttempt = async (success: boolean, reason?: string) => {
    await admin.from("signup_attempts").insert({
      email,
      ip_hash: ipHash,
      success,
      failure_reason: reason ?? null,
    });
  };

  const createAlert = async (severity: "medium" | "high", reason: string, metadata: Record<string, unknown>) => {
    await admin.from("security_alerts").insert({
      category: "signup",
      severity,
      email,
      ip_hash: ipHash,
      reason,
      metadata,
    });
  };

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  let ipAttempts = 0;
  if (ipHash) {
    const { count } = await admin
      .from("signup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);
    ipAttempts = Number(count ?? 0);
  }

  const { count: emailAttemptsCount } = await admin
    .from("signup_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneDayAgo);
  const emailAttempts = Number(emailAttemptsCount ?? 0);

  if (ipAttempts >= 8 || emailAttempts >= 3) {
    await logAttempt(false, "rate_limited");
    await createAlert("high", "rate_limit_exceeded", {
      ipAttempts,
      emailAttempts,
    });
    return json(429, {
      ok: false,
      message: "Muitas tentativas de cadastro. Aguarde e tente novamente.",
    });
  }

  if (isDisposableEmail(email)) {
    await logAttempt(false, "disposable_email");
    return json(400, { ok: false, message: "Use um e-mail corporativo ou pessoal válido." });
  }

  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    await logAttempt(false, "email_validation_error");
    await createAlert("medium", "email_validation_error", {
      error: existingProfileError.message,
    });
    return json(500, { ok: false, message: "Não foi possível validar o e-mail." });
  }

  if (existingProfile?.id) {
    await logAttempt(false, "email_exists");
    return json(409, { ok: false, message: "Este e-mail já possui cadastro. Faça login." });
  }

  const signupClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signUpData, error: signUpError } = await signupClient.auth.signUp({
    email,
    password: payload.password,
    options: {
      emailRedirectTo: `${payload.appOrigin}/auth/callback`,
      data: {
        signup_source: "obrasflow_web",
        nome: payload.nome,
        empresa_nome: payload.empresaNome,
      },
    },
  });

  if (signUpError) {
    await logAttempt(false, signUpError.message);
    await createAlert("medium", "signup_auth_error", {
      error: signUpError.message,
    });
    return json(400, { ok: false, message: signUpError.message });
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    await logAttempt(false, "missing_user_id");
    await createAlert("high", "missing_user_id", {});
    return json(500, { ok: false, message: "Não foi possível criar o usuário. Tente novamente." });
  }

  const { data: empresaId, error: provisionError } = await admin.rpc("provision_trial_tenant", {
    p_user_id: userId,
    p_email: email,
    p_nome: payload.nome,
    p_empresa_nome: payload.empresaNome,
  });

  if (provisionError) {
    await logAttempt(false, "trial_provision_error");
    await createAlert("high", "trial_provision_error", {
      error: provisionError.message,
      userId,
    });
    return json(500, { ok: false, message: "Erro ao provisionar conta trial." });
  }

  await admin.from("consent_events").insert({
    empresa_id: empresaId,
    profile_id: userId,
    consent_type: "termos_privacidade_lgpd",
    accepted: true,
    ip_hash: ipHash,
    user_agent: payload.userAgent || null,
    metadata: { source: "signup_edge_function" },
  });

  await logAttempt(true);

  const session = signUpData.session;
  const needsEmailConfirmation = !session;

  return json(200, {
    ok: true,
    message: needsEmailConfirmation
      ? "Conta criada! Confirme seu e-mail para acessar o painel (validade trial: 14 dias)."
      : "Conta criada com sucesso! Você já pode acessar o painel.",
    needsEmailConfirmation,
    accessToken: session?.access_token,
    refreshToken: session?.refresh_token,
    userId,
    empresaId: (empresaId as string) ?? undefined,
  });
});
