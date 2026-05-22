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
          {items.map((item) => {
            const content = (
              <>
                <p className="of-notif-item-title">{item.titulo}</p>
                <p className="of-notif-item-desc">{item.descricao}</p>
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
