import { NextResponse } from "next/server";
import { listCrmDealsSummary, runCrmFollowupAutomation } from "@/lib/db/crm";

export async function GET() {
  try {
    const deals = await listCrmDealsSummary();
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar negócios CRM";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST() {
  try {
    const result = await runCrmFollowupAutomation();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao executar automações de CRM";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
