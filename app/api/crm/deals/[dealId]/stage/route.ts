import { NextRequest, NextResponse } from "next/server";
import { CRM_STAGES, updateCrmDealStage } from "@/lib/db/crm";
import {
  MasterAccountClientAccessError,
  requireClientProfileOrThrow,
} from "@/lib/auth/require-client-account";

type Body = {
  stage?: string;
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  try {
    await requireClientProfileOrThrow();
  } catch (error) {
    if (error instanceof MasterAccountClientAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  const { dealId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Body | null;
  const stage = String(payload?.stage ?? "").trim().toLowerCase();
  if (!dealId) {
    return NextResponse.json({ error: "Negocio invalido" }, { status: 400 });
  }
  if (!CRM_STAGES.includes(stage as (typeof CRM_STAGES)[number])) {
    return NextResponse.json({ error: "Etapa invalida" }, { status: 400 });
  }

  try {
    await updateCrmDealStage({
      dealId,
      stage: stage as (typeof CRM_STAGES)[number],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar etapa CRM";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
