import { NextResponse } from "next/server";
import { listCrmLossReasonsReport } from "@/lib/db/crm";

export async function GET() {
  try {
    const reasons = await listCrmLossReasonsReport();
    return NextResponse.json({ ok: true, reasons });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar motivos de perda";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
