import { NextRequest, NextResponse } from "next/server";
import { deleteCrmLead, updateCrmLeadStage, upsertCrmLead } from "@/lib/db/crm";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  try {
    if (payload && typeof payload === "object" && typeof (payload as { etapa?: unknown }).etapa === "string") {
      const lead = await updateCrmLeadStage(id, (payload as { etapa: "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Fechado" | "Perdido" }).etapa);
      return NextResponse.json({ ok: true, lead });
    }

    const lead = await upsertCrmLead({ ...(payload as Record<string, unknown>), id } as Parameters<typeof upsertCrmLead>[0]);
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar lead";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await deleteCrmLead(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao remover lead";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
