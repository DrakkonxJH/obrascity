import { NextRequest, NextResponse } from "next/server";
import { listCrmLeadsFromTasks } from "@/lib/db/crm";

export async function GET() {
  try {
    const leads = await listCrmLeadsFromTasks();
    return NextResponse.json({ ok: true, leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar leads";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { ok: false, message: "CRM sincronizado por tarefas da obra. Criação manual desativada." },
    { status: 405 },
  );
}
