import { NextRequest, NextResponse } from "next/server";
import { createCrmDeal, listCrmDealsSummary, runCrmFollowupAutomation } from "@/lib/db/crm";

export async function GET() {
  try {
    const deals = await listCrmDealsSummary();
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar negócios CRM";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> | null = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    if (body && (typeof body.nome === "string" || typeof body.title === "string" || body.intent === "create")) {
      const deal = await createCrmDeal({
        nome: String(body.nome ?? body.title ?? "").trim(),
        descricao: typeof body.descricao === "string" ? body.descricao : typeof body.desc === "string" ? body.desc : "",
        stage: typeof body.stage === "string" ? body.stage : undefined,
        status: typeof body.status === "string" ? body.status : undefined,
        priority: typeof body.priority === "string" ? body.priority : undefined,
        probability: typeof body.probability === "number" ? body.probability : undefined,
        valor: typeof body.valor === "number" ? body.valor : undefined,
        owner_profile_id: typeof body.owner_profile_id === "string" ? body.owner_profile_id : undefined,
        workspace_id: typeof body.workspace_id === "string" ? body.workspace_id : undefined,
        custom_fields: body.custom_fields && typeof body.custom_fields === "object" ? (body.custom_fields as Record<string, string>) : undefined,
        playbook_items: Array.isArray(body.playbook_items) ? (body.playbook_items as Array<{ id: string; label: string; done: boolean }>) : undefined,
      });
      return NextResponse.json({ ok: true, deal });
    }

    const result = await runCrmFollowupAutomation();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao executar automações de CRM";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
