"use client";

import { Obra } from "@/types/domain";
import { useAppUi } from "@/components/templates/app-ui-provider";

type ObraCardProps = {
  obra: Obra;
  statusLabel: (status: string) => string;
  statusBadge: (status: string) => string;
  isLixeira?: boolean;
  daysUntilPurge?: (deletedAt?: string | null) => number;
  children?: React.ReactNode;
};

export function ObraCard({
  obra,
  statusLabel,
  statusBadge,
  isLixeira = false,
  daysUntilPurge,
  children
}: ObraCardProps) {
  const { openDetail } = useAppUi();

  return (
    <article
      className="of-obra-card"
      style={isLixeira ? { borderColor: "rgba(239, 68, 68, 0.35)" } : {}}
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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
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
      aria-label={`Abrir detalhes da obra ${obra.nome}`}
    >
      <div className="of-obra-top">
        <div>
          <p className="of-obra-name">{obra.nome}</p>
          <p className="of-obra-client">{obra.cliente}</p>
        </div>
        <span className={isLixeira ? "of-badge of-badge-red" : statusBadge(obra.status)}>
          {isLixeira ? "Lixeira" : statusLabel(obra.status)}
        </span>
      </div>

      {!isLixeira && (
        <>
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
        </>
      )}

      {isLixeira && (
        <>
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
              <p className="of-obra-meta-value">{daysUntilPurge?.(obra.deleted_at)} dia(s)</p>
            </div>
            <div>
              <p className="of-obra-meta-label">Status original</p>
              <p className="of-obra-meta-value">{statusLabel(obra.status)}</p>
            </div>
          </div>
        </>
      )}

      {children}
    </article>
  );
}
