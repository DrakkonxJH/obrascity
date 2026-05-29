import { NextRequest, NextResponse } from "next/server";
import { updateCrmDealActivity } from "@/lib/db/crm";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const activity = await updateCrmDealActivity(id, body);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar atividade";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
