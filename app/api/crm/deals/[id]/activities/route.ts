import { NextRequest, NextResponse } from "next/server";
import { createCrmDealActivity, listCrmDealActivities } from "@/lib/db/crm";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const activities = await listCrmDealActivities(id);
    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar atividades do negócio";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const activity = await createCrmDealActivity(id, body);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar atividade do negócio";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
