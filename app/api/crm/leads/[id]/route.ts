import { NextRequest, NextResponse } from "next/server";
import { upsertCrmLead, updateCrmLeadStage, deleteCrmLead } from "@/lib/db/crm";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    // If only etapa is sent, use the fast stage update
    if (Object.keys(body).length === 1 && body.etapa) {
      const lead = await updateCrmLeadStage(id, body.etapa);
      return NextResponse.json({ ok: true, lead });
    }
    const lead = await upsertCrmLead({ ...body, id });
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar lead";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await deleteCrmLead(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao remover lead";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
