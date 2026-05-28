import { NextRequest, NextResponse } from "next/server";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: NextRequest, _ctx: Ctx) {
  return NextResponse.json(
    { ok: false, message: "CRM sincronizado por tarefas da obra. Edição manual desativada." },
    { status: 405 },
  );
}

export async function DELETE(_req: NextRequest, _ctx: Ctx) {
  return NextResponse.json(
    { ok: false, message: "CRM sincronizado por tarefas da obra. Remoção manual desativada." },
    { status: 405 },
  );
}
