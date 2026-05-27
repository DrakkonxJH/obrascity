"use client";

import { useMemo, useState } from "react";

type Turn = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  answer: string;
  risk: "low" | "medium" | "high";
  suggestedModule: { label: string; route: string } | null;
  ticketId: string | null;
};

export function AiSupportChat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createTicket, setCreateTicket] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente de suporte do ObrasCitY. Me descreva o problema e eu te guio no diagnóstico. Se precisar, posso abrir ticket automaticamente.",
    },
  ]);
  const [lastMeta, setLastMeta] = useState<Omit<ApiResponse, "answer"> | null>(null);

  const canSend = useMemo(() => message.trim().length > 0 && !loading, [loading, message]);

  async function sendMessage() {
    const text = message.trim();
    if (!text || loading) return;

    const nextTurns: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(nextTurns);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextTurns.slice(-10),
          createTicket,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Falha ao chamar suporte IA." }));
        throw new Error(String(err.error ?? "Falha ao chamar suporte IA."));
      }
      const data = (await response.json()) as ApiResponse;
      setTurns((prev) => [...prev, { role: "assistant", content: data.answer }]);
      setLastMeta({
        risk: data.risk,
        suggestedModule: data.suggestedModule,
        ticketId: data.ticketId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado no suporte IA.";
      setTurns((prev) => [...prev, { role: "assistant", content: `Não consegui responder agora: ${message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="of-card" style={{ marginBottom: 20 }}>
      <div className="of-card-title">Chat de suporte com IA</div>
      <p className="of-list-description" style={{ marginBottom: 12 }}>
        Tire dúvidas de uso, receba diagnóstico guiado e, se necessário, abra ticket para atendimento humano.
      </p>

      <div
        style={{
          border: "1px solid var(--of-border)",
          background: "var(--of-bg-2)",
          borderRadius: 10,
          padding: 12,
          maxHeight: 340,
          overflowY: "auto",
          marginBottom: 10,
          display: "grid",
          gap: 8,
        }}
      >
        {turns.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            style={{
              justifySelf: turn.role === "user" ? "end" : "start",
              maxWidth: "88%",
              padding: "8px 10px",
              borderRadius: 8,
              background: turn.role === "user" ? "var(--of-blue)22" : "var(--of-bg-3)",
              border: "1px solid var(--of-border)",
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
            }}
          >
            {turn.content}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <textarea
          className="of-input"
          placeholder="Ex.: não consigo atualizar o cronograma da obra X..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
        />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--of-text-2)" }}>
          <input
            type="checkbox"
            checked={createTicket}
            onChange={(event) => setCreateTicket(event.target.checked)}
          />
          Abrir ticket automaticamente com esta conversa
        </label>
        <button type="button" className="of-btn-primary" disabled={!canSend} onClick={sendMessage}>
          {loading ? "Analisando..." : "Enviar para IA"}
        </button>
      </div>

      {lastMeta ? (
        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
          <p className="of-list-description">
            <strong>Risco detectado:</strong>{" "}
            <span style={{ color: lastMeta.risk === "high" ? "var(--of-red)" : lastMeta.risk === "medium" ? "var(--of-yellow)" : "var(--of-green)" }}>
              {lastMeta.risk}
            </span>
          </p>
          {lastMeta.suggestedModule ? (
            <p className="of-list-description">
              <strong>Módulo recomendado:</strong> {lastMeta.suggestedModule.label} ({lastMeta.suggestedModule.route})
            </p>
          ) : null}
          {lastMeta.ticketId ? (
            <p className="of-list-description" style={{ color: "var(--of-green)" }}>
              Ticket aberto: {lastMeta.ticketId}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
