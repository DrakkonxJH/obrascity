import { db } from "@/db";
import { leads } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, role, message, source } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios." },
        { status: 400 }
      );
    }

    const [lead] = await db
      .insert(leads)
      .values({
        name,
        email,
        phone: phone || null,
        company: company || null,
        role: role || null,
        message: message || null,
        source: source || "website",
      })
      .returning();

    return NextResponse.json(
      { success: true, id: lead.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
