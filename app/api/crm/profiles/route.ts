import { NextResponse } from "next/server";
import { listCrmAssignableProfiles } from "@/lib/db/crm";

export async function GET() {
  try {
    const profiles = await listCrmAssignableProfiles();
    return NextResponse.json({ ok: true, profiles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar responsáveis";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
