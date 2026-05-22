"use client";

import { usePathname } from "next/navigation";
import type { LayoutSummary } from "@/lib/db/layout-summary";
import { useAppUi } from "@/components/shell/app-ui-provider";

const pageMeta: Record<string, { title: string; icon: string }> = {
  "/dashboard": { title: "Dashboard", icon: "📊" },
  "/obras": { title: "Obras", icon: "🏗️" },
  "/cronograma": { title: "Cronograma", icon: "📅" },
  "/financeiro": { title: "Financeiro", icon: "💰" },
  "/equipes": { title: "Equipes", icon: "👥" },
  "/materiais": { title: "Materiais", icon: "📦" },
  "/diario": { title: "Diário de Obra", icon: "📋" },
  "/qualidade": { title: "Qualidade e SSMA", icon: "🛡️" },
  "/relatórios": { title: "Relatórios", icon: "📋" },
  "/planos": { title: "Planos", icon: "⭐" },
  "/portal": { title: "Portal do Cliente", icon: "🌐" },
  "/configuracoes": { title: "Configurações", icon: "⚙️" },
};

function getPageMeta(pathname: string) {
  for (const [key, value] of Object.entries(pageMeta)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      return value;
    }
  }
  return { title: "ObrasFlow", icon: "🏗️" };
}

type TopbarProps = {
  summary: LayoutSummary;
};

export function Topbar({ summary }: TopbarProps) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const { toggleNotif, toggleMobileSidebar, openNovaObra, notifOpen } = useAppUi();
  const count = summary.unreadNotifications;

  return (
    <header className="of-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="of-mobile-menu-btn" onClick={toggleMobileSidebar} aria-label="Menu">
          ☰
        </button>
        <h1 className="of-topbar-title">
          <span aria-hidden>{meta.icon}</span>
          {meta.title}
        </h1>
      </div>
      <div className="of-topbar-actions">
        <button
          type="button"
          className="of-btn-icon"
          aria-label="Notificações"
          aria-expanded={notifOpen}
          onClick={toggleNotif}
        >
          🔔
          {count > 0 ? <span className="of-btn-notif-count">{count}</span> : null}
        </button>
        <button type="button" className="of-btn-primary" onClick={openNovaObra}>
          + Nova Obra
        </button>
      </div>
    </header>
  );
}
