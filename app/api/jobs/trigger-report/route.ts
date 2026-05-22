import { NextResponse } from "next/server";
import { QueueNames, getQueue } from "@/lib/queue/connection";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await checkRateLimit({
    key: `report:${ip}`,
    limit: 30,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit excedido" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const obraId = String(body?.obraId ?? "global");
  const tipo = String(body?.tipo ?? "progresso");

  const queue = getQueue(QueueNames.REPORTS_GENERATE);
  const jobId = `report:${obraId}:${tipo}:${new Date().toISOString().slice(0, 10)}`;

  const job = await queue.add(
    "generate-report",
    {
      obraId,
      tipo,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId,
    },
  );

  return NextResponse.json({ queued: true, jobId: job.id });
}
