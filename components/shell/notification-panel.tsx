"use client";

import Link from "next/link";
import { useAppUi } from "./app-ui-provider";

export type NotifDisplay = {
  id: string;
  titulo: string;
  descricao: string;
  tempo: string;
  unread: boolean;
  href?: string;
  destino?: string;
};

type NotificationPanelProps = {
  items: NotifDisplay[];
};

export function NotificationPanel({ items }: NotificationPanelProps) {
  const { notifOpen, closeNotif } = useAppUi();

  if (!notifOpen) return null;

  return (
    <>
      <button
        type="button"
        className="of-sidebar-backdrop open"
        style={{ zIndex: 150, background: "transparent" }}
        aria-label="Fechar notificações"
        onClick={closeNotif}
      />
      <div className="of-notif-panel" role="dialog" aria-label="Notificações">
        <div className="of-notif-panel-header">
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notificações</span>
          <button type="button" className="of-notif-mark-read" onClick={closeNotif}>
            Marcar todas lidas
          </button>
        </div>
        <div className="of-notif-list">
          {items.length === 0 ? (
            <div className="of-notif-item" style={{ cursor: "default" }}>
              <p className="of-notif-item-title">Nenhuma pendência da plataforma</p>
              <p className="of-notif-item-desc">
                Quando houver alertas de segurança ou tickets de suporte, eles aparecem aqui.
              </p>
            </div>
          ) : null}
          {items.map((item) => {
            const content = (
              <>
                <p className="of-notif-item-title">{item.titulo}</p>
                <p className="of-notif-item-desc">{item.descricao}</p>
                {item.destino ? <p className="of-notif-item-desc">{`Abre em: ${item.destino}`}</p> : null}
                <p className="of-notif-item-time">{item.tempo}</p>
              </>
            );
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`of-notif-item ${item.unread ? "unread" : ""}`}
                  onClick={closeNotif}
                  title={item.destino ? `Abrir em ${item.destino}` : "Abrir notificação"}
                >
                  {content}
                </Link>
              );
            }
            return (
              <div key={item.id} className={`of-notif-item ${item.unread ? "unread" : ""}`}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
