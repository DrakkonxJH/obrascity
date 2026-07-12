"use client";

import Link from "next/link";
import { useAppUi } from "@/components/templates/app-ui-provider";
import { ObraLifecycleActions } from "@/components/organisms/obra-lifecycle-actions";

export function DetailPanel() {
  const { detail, closeDetail } = useAppUi();

  return (
    <>
      {detail ? (
        <button
          type="button"
          className="of-sidebar-backdrop open"
          style={{ zIndex: 400 }}
          aria-label="Fechar painel"
          onClick={closeDetail}
        />
      ) : null}
      <aside className={`of-detail-panel ${detail ? "open" : ""}`} aria-hidden={!detail}>
        <div className="of-detail-panel-header">
          <h2 className="of-detail-panel-title">{detail?.title ?? ""}</h2>
          <button type="button" className="of-detail-close" onClick={closeDetail} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="of-detail-body">
          {detail?.rows.map((row) => (
            <div key={row.label} className="of-detail-row">
              <span className="of-detail-row-label">{row.label}</span>
              <span className="of-detail-row-value">{row.value}</span>
            </div>
          ))}
          {detail?.obra?.deleted_at ? (
            <div className="of-detail-row">
              <span className="of-detail-row-label">Lixeira</span>
              <span className="of-detail-row-value">Esta obra pode ser restaurada até 15 dias após a exclusão.</span>
            </div>
          ) : null}
          {detail?.obra ? (
            <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
              {!detail.obra.deleted_at ? (
                <Link href={`/obras/${detail.obra.id}`} className="of-btn-primary" style={{ display: "inline-block" }}>
                  Abrir página completa
                </Link>
              ) : null}
              <ObraLifecycleActions obra={detail.obra} onDone={closeDetail} />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
