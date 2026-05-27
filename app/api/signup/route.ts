import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the Supabase signup-orchestrator edge function.
// Avoids browser CORS restrictions by forwarding the request server-to-server.
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sharedSecret = process.env.SIGNUP_EDGE_SHARED_SECRET;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, message: "Configuração do servidor incompleta" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Payload inválido" },
      { status: 400 }
    );
  }

  const isJwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(anonKey);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
  };
  if (isJwt) headers["Authorization"] = `Bearer ${anonKey}`;
  if (sharedSecret) headers["x-signup-edge-secret"] = sharedSecret;

  const edgeUrl = `${supabaseUrl}/functions/v1/signup-orchestrator`;

  let edgeRes: Response;
  try {
    edgeRes = await fetch(edgeUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[signup-proxy] fetch error:", err);
    return NextResponse.json(
      { ok: false, message: "Falha ao conectar ao serviço de cadastro" },
      { status: 502 }
    );
  }

  let data: unknown;
  try {
    data = await edgeRes.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Resposta inválida do serviço de cadastro" },
      { status: 502 }
    );
  }

  return NextResponse.json(data, { status: edgeRes.status });
}
