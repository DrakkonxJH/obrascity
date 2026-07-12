"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppUi } from "@/components/templates/app-ui-provider";

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
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
};

export function NotificationPanel({ items, onMarkAsRead, onMarkAllAsRead }: NotificationPanelProps) {
  const { notifOpen, closeNotif } = useAppUi();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    if (!onMarkAsRead) return;
    setIsLoading(true);
    try {
      await onMarkAsRead(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!onMarkAllAsRead) return;
    setIsLoading(true);
    try {
      await onMarkAllAsRead();
    } finally {
      setIsLoading(false);
    }
  };

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
          <span>Notificações</span>
          <button 
            type="button" 
            className="of-notif-mark-read" 
            onClick={async () => {
              await handleMarkAllAsRead();
              closeNotif();
            }}
            disabled={isLoading}
          >
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
              <div className="of-notif-content">
                <p className="of-notif-item-title">{item.titulo}</p>
                <p className="of-notif-item-desc">{item.descricao}</p>
                {item.destino ? <p className="of-notif-item-desc">{`Abre em: ${item.destino}`}</p> : null}
                <p className="of-notif-item-time">{item.tempo}</p>
              </div>
            );
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`of-notif-item ${item.unread ? "unread" : ""}`}
                  onClick={async () => {
                    if (item.unread && onMarkAsRead) {
                      await handleMarkAsRead(item.id);
                    }
                    closeNotif();
                  }}
                  title={item.destino ? `Abrir em ${item.destino}` : "Abrir notificação"}
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className={`of-notif-item ${item.unread ? "unread" : ""}`}
                style={{ border: "none", background: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
                onClick={async () => {
                  if (item.unread && onMarkAsRead) {
                    await handleMarkAsRead(item.id);
                  }
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
