import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  MasterAccountClientAccessError,
  requireClientProfileOrThrow,
} from "@/lib/auth/require-client-account";
import { getEnv } from "@/lib/validations/env";

const BLOCKED_LOGIN_PATHS = new Set(["/sign-in", "/login", "/users/login"]);

function normalizeTargetPath(pathSegments: string[] | undefined) {
  if (!pathSegments || pathSegments.length === 0) return "/";
  return `/${pathSegments.map((segment) => segment.trim()).filter(Boolean).join("/")}`;
}

function createProxyToken(input: {
  userId: string;
  empresaId: string;
  role: string | null;
  secret: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    sub: input.userId,
    empresa_id: input.empresaId,
    role: input.role ?? "visualizador",
    iat: now,
    exp: now + 60,
  });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = createHmac("sha256", input.secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers();
  const copyHeaders = ["accept", "content-type", "user-agent", "accept-language"];
  for (const name of copyHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function applyTunnelBypassHeaders(headers: Headers, targetUrl: URL) {
  const host = targetUrl.hostname.toLowerCase();
  if (host.endsWith(".loca.lt")) {
    headers.set("bypass-tunnel-reminder", "true");
    headers.set("x-tunnel-bypass", "true");
  }
}

function buildResponseHeaders(upstream: Headers, internalOrigin: string, appOrigin: string) {
  const headers = new Headers();
  upstream.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "set-cookie" ||
      lower === "content-length" ||
      lower === "transfer-encoding" ||
      lower === "connection"
    ) {
      return;
    }
    if (lower === "location") {
      try {
        const locationUrl = new URL(value, internalOrigin);
        const internal = new URL(internalOrigin);
        if (locationUrl.origin === internal.origin) {
          const rewritten = `${appOrigin}/api/crm/proxy${locationUrl.pathname}${locationUrl.search}`;
          headers.set("location", rewritten);
          return;
        }
      } catch {
        // Mantém o header original quando não for URL válida.
      }
    }
    headers.set(key, value);
  });

  headers.set("cache-control", "no-store");
  return headers;
}

async function handleProxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const env = getEnv();
  if (!env.CRM_INTERNAL_URL) {
    const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CRM interno não configurado</title>
    <style>
      body { margin:0; font-family: Inter, system-ui, -apple-system, sans-serif; background:#060b18; color:#dce7ff; }
      .wrap { max-width: 760px; margin: 40px auto; padding: 20px; }
      .card { border:1px solid #1f355e; border-radius: 14px; background:#0b1326; padding: 18px; }
      h1 { margin:0 0 10px; font-size: 1.2rem; }
      p { margin:8px 0; color:#a9b8d8; line-height:1.5; }
      code { background:#0f1e3d; border:1px solid #224476; padding:2px 6px; border-radius:6px; color:#d0e2ff; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>CRM interno não configurado</h1>
        <p>O novo CRM foi ativado, mas a URL do WeKan interno ainda não foi definida no ambiente de produção.</p>
        <p>Configure a variável <code>CRM_INTERNAL_URL</code> na Vercel (Production) com a URL do serviço WeKan.</p>
      </div>
    </div>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  let profile: Awaited<ReturnType<typeof requireClientProfileOrThrow>>;
  try {
    profile = await requireClientProfileOrThrow();
  } catch (error) {
    if (error instanceof MasterAccountClientAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const { path } = await context.params;
  const targetPath = normalizeTargetPath(path);
  if (BLOCKED_LOGIN_PATHS.has(targetPath.toLowerCase())) {
    return NextResponse.redirect(new URL("/crm", request.url));
  }

  const baseUrl = env.CRM_INTERNAL_URL.endsWith("/") ? env.CRM_INTERNAL_URL : `${env.CRM_INTERNAL_URL}/`;
  const upstreamUrl = new URL(targetPath.slice(1), baseUrl);
  upstreamUrl.search = request.nextUrl.search;

  const headers = buildForwardHeaders(request);
  applyTunnelBypassHeaders(headers, upstreamUrl);
  headers.set("x-obrasflow-user-id", profile.id);
  headers.set("x-obrasflow-empresa-id", profile.empresa_id);
  headers.set("x-obrasflow-role", profile.role ?? "visualizador");
  if (env.CRM_PROXY_SHARED_SECRET) {
    headers.set(
      "x-obrasflow-auth",
      createProxyToken({
        userId: profile.id,
        empresaId: profile.empresa_id,
        role: profile.role,
        secret: env.CRM_PROXY_SHARED_SECRET,
      }),
    );
  }

  const isBodyMethod = !["GET", "HEAD"].includes(request.method.toUpperCase());
  const body = isBodyMethod ? await request.arrayBuffer() : undefined;

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao conectar CRM interno";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const appOrigin = request.nextUrl.origin;
  const responseHeaders = buildResponseHeaders(upstreamResponse.headers, env.CRM_INTERNAL_URL, appOrigin);
  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(request, context);
}
