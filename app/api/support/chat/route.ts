import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSupportReply, type SupportChatTurn } from "@/lib/support/ai-assistant";

type ChatBody = {
  message?: string;
  history?: SupportChatTurn[];
  createTicket?: boolean;
};

function normalizeHistory(input: unknown): SupportChatTurn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is SupportChatTurn => {
      if (!item || typeof item !== "object") return false;
      const row = item as SupportChatTurn;
      return (row.role === "user" || row.role === "assistant") && typeof row.content === "string";
    })
    .slice(-12);
}

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile?.id || !profile.empresa_id) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as ChatBody | null;
  const message = String(payload?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
  }

  const history = normalizeHistory(payload?.history);
  const chatResult = await generateSupportReply(message, history);

  let ticketId: string | null = null;
  if (payload?.createTicket) {
    const admin = createAdminClient();
    const priority = chatResult.risk === "high" ? "alta" : chatResult.risk === "medium" ? "media" : "baixa";
    const title = `Suporte IA · ${message.slice(0, 80)}`;
    const description = [
      "Solicitação aberta via chat de suporte IA.",
      "",
      `Usuário: ${profile.nome ?? profile.email ?? profile.id}`,
      `Mensagem: ${message}`,
      "",
      "Resposta IA:",
      chatResult.answer,
    ].join("\n");

    const { data, error } = await admin
      .from("support_tickets")
      .insert({
        empresa_id: profile.empresa_id,
        opened_by_profile_id: profile.id,
        owner_profile_id: null,
        title,
        description,
        category: "suporte_ia",
        priority,
        status: "aberto",
        metadata: { origin: "support_ai_chat", risk: chatResult.risk },
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json({ error: `Erro ao abrir ticket: ${error?.message ?? "sem id"}` }, { status: 500 });
    }

    ticketId = data.id;

    await admin.from("support_ticket_events").insert({
      ticket_id: data.id,
      actor_profile_id: profile.id,
      event_type: "ticket_criado",
      message: "Ticket aberto automaticamente pelo chat de suporte IA.",
      metadata: {
        ai_answer: chatResult.answer,
        user_message: message,
      },
    });
  }

  return NextResponse.json({
    answer: chatResult.answer,
    risk: chatResult.risk,
    suggestedModule: chatResult.suggestedModule,
    ticketId,
  });
}
