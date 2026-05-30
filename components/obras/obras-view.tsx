"use client";

import { useMemo, useState } from "react";
import type { Obra } from "@/types/domain";
import { useAppUi } from "@/components/shell/app-ui-provider";
import { ObraLifecycleActions } from "./obra-lifecycle-actions";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

type ObraWithBudget = Obra & { budgetPct: number };

type ObrasViewProps = {
  obrasAtivas: ObraWithBudget[];
  obrasLixeira: Obra[];
};

type FilterKey = "ativas" | "lixeira";

function statusBadge(status: string) {
  if (status === "concluida") return "of-badge of-badge-green";
  if (status === "atencao") return "of-badge of-badge-yellow";
  if (status === "andamento") return "of-badge of-badge-blue";
  return "of-badge";
}

function statusLabel(status: string) {
  if (status === "concluida") return "Concluída";
  if (status === "atencao") return "Atenção";
  if (status === "andamento") return "Em andamento";
  return "Planejamento";
}

function daysUntilPurge(deletedAt?: string | null) {
  if (!deletedAt) return 15;
  const deleted = new Date(deletedAt).getTime();
  const now = Date.now();
  const remaining = 15 - Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

export function ObrasView({ obrasAtivas, obrasLixeira }: ObrasViewProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ativas");
  const { openDetail, trashEnabled } = useAppUi();

  const totalAndamento = obrasAtivas.filter((o) => o.status === "andamento").length;
  const totalAtencao = obrasAtivas.filter((o) => o.status === "atencao").length;

  const filteredAtivas = useMemo(() => {
    const q = query.toLowerCase();
    return obrasAtivas.filter((obra) => {
      const matchesQuery =
        !q || obra.nome.toLowerCase().includes(q) || obra.cliente.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [obrasAtivas, query]);

  const filteredLixeira = useMemo(() => {
    const q = query.toLowerCase();
    return obrasLixeira.filter((obra) => {
      const matchesQuery =
        !q || obra.nome.toLowerCase().includes(q) || obra.cliente.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [obrasLixeira, query]);

  const visibleCount = filter === "ativas" ? filteredAtivas.length : filteredLixeira.length;

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Execucao"
        title="Carteira de obras"
        subtitle="Controle status, progresso e saude de orcamento das obras ativas e da lixeira operacional."
      />
      <div className="of-kpi-grid" style={{ marginTop: -2 }}>
        <article className="of-metric-card blue">
          <p className="of-kpi-label">Obras ativas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>{obrasAtivas.length}</p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-label">Em andamento</p>
          <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>{totalAndamento}</p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">Concluídas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>
            {obrasAtivas.filter((o) => o.status === "concluida").length}
          </p>
        </article>
        <article className="of-metric-card">
          <p className="of-kpi-label">Lixeira</p>
          <p className="of-kpi-value" style={{ color: "var(--of-red)" }}>{obrasLixeira.length}</p>
        </article>
      </div>
      <div className="of-obras-toolbar">
        <div className="of-search-wrap">
          <span className="of-search-icon" aria-hidden><Search size={14} /></span>
          <input
            className="of-search-input"
            placeholder="Buscar obras, clientes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="of-filter-tabs">
          <button
            type="button"
            className={`of-filter-tab ${filter === "ativas" ? "active" : ""}`}
            onClick={() => setFilter("ativas")}
          >
            Ativas ({obrasAtivas.length})
          </button>
          {trashEnabled ? (
            <button
              type="button"
              className={`of-filter-tab ${filter === "lixeira" ? "active" : ""}`}
              onClick={() => setFilter("lixeira")}
            >
              Lixeira ({obrasLixeira.length})
            </button>
          ) : null}
        </div>
      </div>

      {filter === "ativas" || !trashEnabled ? (
        <div className="of-obras-grid">
          {filteredAtivas.map((obra) => (
            <article
              key={obra.id}
              className="of-obra-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                openDetail({
                  title: obra.nome,
                  obra,
                  rows: [
                    { label: "Cliente", value: obra.cliente },
                    { label: "Status", value: statusLabel(obra.status) },
                    { label: "Progresso", value: `${obra.progresso}%` },
                    { label: "Orçamento consumido", value: `${obra.budgetPct}%` },
                  ],
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  openDetail({
                    title: obra.nome,
                    obra,
                    rows: [
                      { label: "Cliente", value: obra.cliente },
                      { label: "Status", value: statusLabel(obra.status) },
                      { label: "Progresso", value: `${obra.progresso}%` },
                      { label: "Orçamento consumido", value: `${obra.budgetPct}%` },
                    ],
                  });
                }
              }}
            >
              <div className="of-obra-top">
                <div>
                  <p className="of-obra-name">{obra.nome}</p>
                  <p className="of-obra-client">{obra.cliente}</p>
                </div>
                <span className={statusBadge(obra.status)}>{statusLabel(obra.status)}</span>
              </div>
              <div className="of-obra-progress-wrap">
                <div className="of-progress-header">
                  <span>Progresso</span>
                  <span className="of-mono">{obra.progresso}%</span>
                </div>
                <div className="of-progress-bar">
                  <div className="of-progress-fill" style={{ width: `${obra.progresso}%`, background: "var(--of-blue)" }} />
                </div>
              </div>
              <div className="of-obra-budget-bar">
                <span>Orçamento</span>
                <div className="of-obra-budget-track">
                  <div className="of-obra-budget-fill" style={{ width: `${obra.budgetPct}%` }} />
                </div>
                <span className="of-mono">{obra.budgetPct}%</span>
              </div>
              <div className="of-obra-meta-row">
                <div>
                  <p className="of-obra-meta-label">Status</p>
                  <p className="of-obra-meta-value">{statusLabel(obra.status)}</p>
                </div>
                <div>
                  <p className="of-obra-meta-label">Atualização</p>
                  <p className="of-obra-meta-value">Em tempo real</p>
                </div>
                <div>
                  <p className="of-obra-meta-label">Detalhes</p>
                  <p className="of-obra-meta-value">Abrir painel</p>
                </div>
              </div>
            </article>
          ))}
          {filteredAtivas.length === 0 ? <p className="of-empty-text">Nenhuma obra encontrada.</p> : null}
        </div>
      ) : (
        <div className="of-obras-grid">
          {filteredLixeira.map((obra) => (
            <article key={obra.id} className="of-obra-card" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>
              <div className="of-obra-top">
                <div>
                  <p className="of-obra-name">{obra.nome}</p>
                  <p className="of-obra-client">{obra.cliente}</p>
                </div>
                <span className="of-badge of-badge-red">Lixeira</span>
              </div>
              <div className="of-obra-progress-wrap">
                <div className="of-progress-header">
                  <span>Progresso salvo</span>
                  <span className="of-mono">{obra.progresso}%</span>
                </div>
                <div className="of-progress-bar">
                  <div className="of-progress-fill" style={{ width: `${obra.progresso}%`, background: "var(--of-red)" }} />
                </div>
              </div>
              <div className="of-obra-meta-row">
                <div>
                  <p className="of-obra-meta-label">Excluída em</p>
                  <p className="of-obra-meta-value">
                    {obra.deleted_at ? new Date(obra.deleted_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <div>
                  <p className="of-obra-meta-label">Restante</p>
                  <p className="of-obra-meta-value">{daysUntilPurge(obra.deleted_at)} dia(s)</p>
                </div>
                <div>
                  <p className="of-obra-meta-label">Status original</p>
                  <p className="of-obra-meta-value">{statusLabel(obra.status)}</p>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <ObraLifecycleActions obra={obra} compact />
              </div>
            </article>
          ))}
          {filteredLixeira.length === 0 ? <p className="of-empty-text">A lixeira está vazia.</p> : null}
        </div>
      )}

      <p className="of-empty-text" style={{ marginTop: 12 }}>
        Exibindo {visibleCount} obra(s) {filter === "ativas" ? "ativa(s)" : "na lixeira"}.
      </p>

      {filter === "ativas" ? (
        <div className="of-empty-text" style={{ marginTop: 6 }}>
          Em andamento: {totalAndamento} · Atenção: {totalAtencao}
        </div>
      ) : null}
    </section>
  );
}
