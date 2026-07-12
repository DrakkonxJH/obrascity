"use client";

import { useMemo, useState } from "react";
import type { Obra } from "@/types/domain";
import { useAppUi } from "@/components/templates/app-ui-provider";
import { ObraCard } from "@/components/organisms/obra-card";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/molecules/page-header";
import Link from "next/link";
import { ObraLifecycleActions } from "./obra-lifecycle-actions";

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
        actions={
          <Link className="of-btn-ghost" href="/cronograma">Ir para cronograma</Link>
        }
      />
      <div className="of-kpi-grid" style={{ marginTop: -2 }}>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Obras ativas</div>
          <div className="of-kpi-value" style={{ color: "var(--of-blue)" }}>{obrasAtivas.length}</div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Em andamento</div>
          <div className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>{totalAndamento}</div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Concluídas</div>
          <div className="of-kpi-value" style={{ color: "var(--of-green)" }}>
            {obrasAtivas.filter((o) => o.status === "concluida").length}
          </div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Lixeira</div>
          <div className="of-kpi-value" style={{ color: "var(--of-red)" }}>{obrasLixeira.length}</div>
        </article>
      </div>
      <div className="of-obras-toolbar">
        <div className="of-search-wrap">
          <span className="of-search-icon" aria-hidden><Search size={14} /></span>
          <input
            className="of-search-input"
            aria-label="Buscar por nome da obra ou cliente"
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
            <ObraCard
              key={obra.id}
              obra={obra}
              statusLabel={statusLabel}
              statusBadge={statusBadge}
            />
          ))}
          {filteredAtivas.length === 0 ? (
            <p className="of-empty-text">
              Nenhuma obra encontrada para esse filtro. Ajuste a busca ou cadastre uma nova obra.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="of-obras-grid">
          {filteredLixeira.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              statusLabel={statusLabel}
              statusBadge={statusBadge}
              isLixeira
              daysUntilPurge={daysUntilPurge}
            >
              <div style={{ marginTop: 14 }}>
                <ObraLifecycleActions obra={obra} compact />
              </div>
            </ObraCard>
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
