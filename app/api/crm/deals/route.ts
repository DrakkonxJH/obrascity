import { NextResponse } from "next/server";
import { listCrmDealsSummary } from "@/lib/db/crm";

export async function GET() {
  try {
    const deals = await listCrmDealsSummary();
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar negócios CRM";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

