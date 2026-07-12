"use client";

import { useState } from "react";

type TerminalResponse = {
  ok: boolean;
  command: string;
  output: string;
  executedAt: string;
};

type HistoryItem = {
  id: string;
  command: string;
  output: string;
  ok: boolean;
  executedAt: string;
};

const QUICK_COMMANDS = [
  "help",
  "status",
  "queue",
  "alerts 10",
  "tickets 10",
  "tenants 10",
  "logs 20",
];

export function OpsTerminal() {
  const [command, setCommand] = useState("help");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function run(rawCommand?: string) {
    const nextCommand = (rawCommand ?? command).trim();
    if (!nextCommand || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/master/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: nextCommand }),
      });
      const payload = (await response.json()) as TerminalResponse | { error?: string };
      if (!response.ok || !("ok" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Falha ao executar comando");
      }
      setHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          command: payload.command,
          output: payload.output,
          ok: payload.ok,
          executedAt: payload.executedAt,
        },
        ...prev,
      ]);
      setCommand("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      setHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          command: nextCommand,
          output: `Erro: ${message}`,
          ok: false,
          executedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_COMMANDS.map((item) => (
          <button
            key={item}
            type="button"
            style={{
              border: "1px solid var(--of-border)",
              borderRadius: 8,
              background: "transparent",
              color: "var(--of-text-2)",
              padding: "4px 9px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
            onClick={() => run(item)}
            disabled={loading}
          >
            {item}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Digite um comando (ex: status)"
          className="of-input"
          style={{ fontFamily: "monospace", flex: 1 }}
        />
        <button type="submit" className="of-btn-primary" disabled={loading}>
          {loading ? "Executando..." : "Executar"}
        </button>
      </form>

      <div
        style={{
          border: "1px solid var(--of-border)",
          borderRadius: 10,
          background: "var(--of-bg-2)",
          padding: 12,
          maxHeight: 420,
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {history.length === 0 ? (
          <div style={{ color: "var(--of-text-3)" }}>
            Terminal pronto. Execute <strong>help</strong> para listar os comandos.
          </div>
        ) : null}

        {history.map((item) => (
          <div key={item.id} style={{ marginBottom: 14 }}>
            <div style={{ color: item.ok ? "var(--of-green)" : "var(--of-red)" }}>
              {`$ ${item.command}  (${new Date(item.executedAt).toLocaleString("pt-BR")})`}
            </div>
            <div style={{ color: "var(--of-text)" }}>{item.output}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
