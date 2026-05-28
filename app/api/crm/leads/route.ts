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
  try {
    const body = await req.json();
    const lead = await upsertCrmLead(body);
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar lead";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
