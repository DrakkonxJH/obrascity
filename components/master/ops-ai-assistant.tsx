"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Turn = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  ok: boolean;
  answer: string;
  risk: "low" | "medium" | "high";
  summary?: {
    companies: number;
    alerts: number;
    highAlerts: number;
    openTickets: number;
    queueFailures: number;
    queueWaiting: number;
  };
  queueNote?: string | null;
  suggestedActions?: Array<{ label: string; href: string }>;
  updatedAlerts?: number;
};

const QUICK_PROMPTS = [
  "Faça um diagnóstico operacional do ambiente agora.",
  "Liste os problemas mais urgentes e as ações seguras sugeridas.",
  "Quais alertas devem ser triados primeiro?",
];

export function OpsAiAssistant() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Estou pronto para analisar alertas, tickets e filas. Posso fazer triagem segura e orientar os próximos reparos.",
    },
  ]);
  const [lastMeta, setLastMeta] = useState<ApiResponse | null>(null);

  const canSend = useMemo(() => message.trim().length > 0 && !loading, [loading, message]);

  async function analyze(prompt?: string) {
    const text = (prompt ?? message).trim();
    if (!text || loading) return;

    const nextTurns: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(nextTurns);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/master/ops-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextTurns.slice(-8) }),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse | { error?: string };
      if (!response.ok || !("answer" in data)) {
        throw new Error(("error" in data && data.error) || "Falha ao analisar operações");
      }

      setTurns((prev) => [...prev, { role: "assistant", content: data.answer }]);
      setLastMeta(data);
    } catch (error) {
      const content = error instanceof Error ? error.message : "Erro inesperado";
      setTurns((prev) => [...prev, { role: "assistant", content: `Não consegui analisar agora: ${content}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function startSafeTriage() {
    if (ackLoading) return;
    setAckLoading(true);
    try {
      const response = await fetch("/api/master/ops-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ack_high_alerts" }),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse | { error?: string };
      if (!response.ok || !("answer" in data)) {
        throw new Error(("error" in data && data.error) || "Falha ao iniciar triagem");
      }
      setTurns((prev) => [...prev, { role: "assistant", content: data.answer }]);
      setLastMeta(data);
      router.refresh();
    } catch (error) {
      const content = error instanceof Error ? error.message : "Erro inesperado";
      setTurns((prev) => [...prev, { role: "assistant", content: `Não consegui iniciar a triagem: ${content}` }]);
    } finally {
      setAckLoading(false);
    }
  }

  return (
    <article className="of-card">
      <div className="of-card-title">IA de operações</div>
      <p className="of-list-description" style={{ marginBottom: 12 }}>
        Triagem assistida de alertas, tickets e filas. A IA sugere reparos seguros e pode iniciar a triagem dos alertas high.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item}
            type="button"
            className="of-btn-ghost"
            style={{ minHeight: 34 }}
            onClick={() => void analyze(item)}
            disabled={loading}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="of-btn-primary"
          style={{ minHeight: 34 }}
          onClick={() => void startSafeTriage()}
          disabled={ackLoading}
        >
          {ackLoading ? "Iniciando triagem..." : "Triar alertas high"}
        </button>
      </div>

      <div
        style={{
          border: "1px solid var(--of-border)",
          borderRadius: 10,
          background: "var(--of-bg-2)",
          padding: 12,
          maxHeight: 320,
          overflowY: "auto",
          display: "grid",
          gap: 8,
        }}
      >
        {turns.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            style={{
              justifySelf: turn.role === "user" ? "end" : "start",
              maxWidth: "92%",
              padding: "8px 10px",
              borderRadius: 8,
              background: turn.role === "user" ? "var(--of-blue)22" : "var(--of-bg-3)",
              border: "1px solid var(--of-border)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
              fontSize: "0.9rem",
            }}
          >
            {turn.content}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <textarea
          className="of-input"
          rows={3}
          placeholder="Ex.: quais são os alertas high mais críticos e o que devo fazer agora?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="of-btn-primary" onClick={() => void analyze()} disabled={!canSend}>
            {loading ? "Analisando..." : "Analisar"}
          </button>
          <Link href="/contas?tab=seguranca" className="of-btn-ghost" style={{ minHeight: 42, alignContent: "center" }}>
            Abrir Segurança
          </Link>
          <Link href="/contas?tab=terminal" className="of-btn-ghost" style={{ minHeight: 42, alignContent: "center" }}>
            Abrir Terminal
          </Link>
        </div>
      </div>

      {lastMeta ? (
        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
          <p className="of-list-description">
            <strong>Risco:</strong>{" "}
            <span style={{ color: lastMeta.risk === "high" ? "var(--of-red)" : lastMeta.risk === "medium" ? "var(--of-yellow)" : "var(--of-green)" }}>
              {lastMeta.risk}
            </span>
          </p>
          {lastMeta.summary ? (
            <p className="of-list-description">
              <strong>Resumo:</strong> {lastMeta.summary.highAlerts} alertas high, {lastMeta.summary.openTickets} tickets abertos,
              {` `}{lastMeta.summary.queueFailures} falhas de fila.
            </p>
          ) : null}
          {lastMeta.queueNote ? <p className="of-list-description">{lastMeta.queueNote}</p> : null}
          {lastMeta.suggestedActions?.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {lastMeta.suggestedActions.map((action) => (
                <Link key={action.href} href={action.href} className="of-btn-ghost" style={{ minHeight: 34, alignContent: "center" }}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
          {typeof lastMeta.updatedAlerts === "number" ? (
            <p className="of-list-description" style={{ color: "var(--of-green)" }}>
              {lastMeta.updatedAlerts} alertas foram marcados como em análise.
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
