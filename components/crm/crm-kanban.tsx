"use client";

import { useMemo, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";

type Deal = {
  id: string;
  nome: string;
  empresa_nome: string | null;
  contato_nome: string | null;
  valor: number;
  stage: "novos" | "qualificacao" | "proposta" | "negociacao" | "fechado_ganho";
  priority: "baixa" | "media" | "alta";
  owner_nome: string | null;
  next_activity_at: string | null;
  last_activity_at: string | null;
  tags: string[];
  updated_at: string;
};

type CrmKanbanProps = {
  deals: Deal[];
};

const STAGES = [
  { key: "novos", label: "Novos", color: "#14d8ff" },
  { key: "qualificacao", label: "Qualificacao", color: "#00b9ff" },
  { key: "proposta", label: "Proposta", color: "#2d7dff" },
  { key: "negociacao", label: "Negociacao", color: "#ffae00" },
  { key: "fechado_ganho", label: "Fechado ganho", color: "#79d70f" },
] as const;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityStyle(priority: Deal["priority"]) {
  if (priority === "alta") return { color: "var(--of-red)", border: "1px solid #ff5f5f66", bg: "#ff5f5f1a" };
  if (priority === "media") return { color: "var(--of-yellow)", border: "1px solid #f5c45166", bg: "#f5c4511a" };
  return { color: "var(--of-blue)", border: "1px solid #52a3ff66", bg: "#52a3ff1a" };
}

export function CrmKanban({ deals }: CrmKanbanProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(deals[0]?.id ?? null);
  const [movingDealId, setMovingDealId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selected = useMemo(() => deals.find((deal) => deal.id === selectedDealId) ?? null, [deals, selectedDealId]);

  async function moveDeal(dealId: string, stage: (typeof STAGES)[number]["key"]) {
    if (!dealId) return;
    setMovingDealId(dealId);
    const response = await fetch(`/api/crm/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      alert(body?.error ?? "Nao foi possivel mover o negocio");
      setMovingDealId(null);
      return;
    }
    startTransition(() => {
      router.refresh();
      setMovingDealId(null);
    });
  }

  function onDrop(stage: (typeof STAGES)[number]["key"], event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const dealId = event.dataTransfer.getData("text/deal-id");
    void moveDeal(dealId, stage);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(280px, 1fr)",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage.key);
          const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.valor, 0);
          return (
            <section
              key={stage.key}
              className="of-card"
              style={{ margin: 0, minHeight: 460, padding: 10, background: "rgba(14, 26, 48, 0.35)" }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(stage.key, event)}
            >
              <header
                style={{
                  borderRadius: 10,
                  padding: "8px 10px",
                  background: `${stage.color}22`,
                  border: `1px solid ${stage.color}66`,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: stage.color }}>{stage.label}</p>
                  <span className="of-badge of-badge-blue">{stageDeals.length}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "1.05rem", fontWeight: 700 }}>{money.format(stageTotal)}</p>
              </header>

              <div style={{ display: "grid", gap: 8 }}>
                {stageDeals.length === 0 ? (
                  <p className="of-empty-text" style={{ padding: "8px 6px" }}>
                    Arraste um negocio para esta etapa.
                  </p>
                ) : null}
                {stageDeals.map((deal) => {
                  const priority = priorityStyle(deal.priority);
                  const busy = movingDealId === deal.id || isPending;
                  return (
                    <article
                      key={deal.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/deal-id", deal.id)}
                      onClick={() => setSelectedDealId(deal.id)}
                      style={{
                        border: "1px solid var(--of-border)",
                        borderRadius: 10,
                        padding: "10px 11px",
                        background: selectedDealId === deal.id ? "rgba(16, 34, 67, 0.95)" : "rgba(8, 16, 34, 0.8)",
                        cursor: "grab",
                        opacity: busy ? 0.65 : 1,
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700 }}>{deal.nome}</p>
                      <p className="of-list-description" style={{ marginTop: 3 }}>{deal.empresa_nome ?? "Sem empresa"}</p>
                      <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{money.format(deal.valor)}</p>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        <span className="of-badge of-badge-blue">{deal.contato_nome ?? "Sem contato"}</span>
                        <span
                          className="of-badge"
                          style={{
                            border: priority.border,
                            color: priority.color,
                            background: priority.bg,
                          }}
                        >
                          {deal.priority}
                        </span>
                      </div>

                      <div style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--of-text-2)", display: "grid", gap: 2 }}>
                        <span>Responsavel: {deal.owner_nome ?? "Sem responsavel"}</span>
                        <span>Ult. atividade: {fmtDateTime(deal.last_activity_at)}</span>
                        <span>Prox. atividade: {fmtDateTime(deal.next_activity_at)}</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.78rem" }}>
                        <span className="of-list-description">Atualizado: {fmtDateTime(deal.updated_at)}</span>
                        <span className="of-list-description">{deal.tags.length} tags</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selected ? (
        <article className="of-card">
          <div className="of-card-title">Painel do negocio selecionado</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <div>
              <p className="of-empty-text">Negocio</p>
              <p>{selected.nome}</p>
            </div>
            <div>
              <p className="of-empty-text">Empresa</p>
              <p>{selected.empresa_nome ?? "Sem empresa"}</p>
            </div>
            <div>
              <p className="of-empty-text">Contato</p>
              <p>{selected.contato_nome ?? "Sem contato"}</p>
            </div>
            <div>
              <p className="of-empty-text">Valor</p>
              <p>{money.format(selected.valor)}</p>
            </div>
            <div>
              <p className="of-empty-text">Responsavel</p>
              <p>{selected.owner_nome ?? "Sem responsavel"}</p>
            </div>
            <div>
              <p className="of-empty-text">Prioridade</p>
              <p>{selected.priority}</p>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
