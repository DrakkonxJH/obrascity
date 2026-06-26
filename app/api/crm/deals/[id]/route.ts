import { NextRequest, NextResponse } from "next/server";
import { deleteCrmDeal, updateCrmDeal } from "@/lib/db/crm";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const deal = await updateCrmDeal(id, body);
    return NextResponse.json({ ok: true, deal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar negócio";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await deleteCrmDeal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir negócio";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
