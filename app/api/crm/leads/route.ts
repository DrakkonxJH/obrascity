import { NextRequest, NextResponse } from "next/server";
import { listCrmLeads, upsertCrmLead } from "@/lib/db/crm";

export async function GET() {
  try {
    const leads = await listCrmLeads();
    return NextResponse.json({ ok: true, leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar leads";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || typeof (payload as { nome?: unknown }).nome !== "string") {
    return NextResponse.json({ ok: false, message: "Campo nome é obrigatório" }, { status: 400 });
  }

  try {
    const lead = await upsertCrmLead(payload as Parameters<typeof upsertCrmLead>[0]);
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar lead";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
