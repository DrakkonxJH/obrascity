"use client";

import { usePathname } from "next/navigation";
import type { LayoutSummary } from "@/lib/db/layout-summary";
import { useAppUi } from "@/components/shell/app-ui-provider";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  FolderKanban,
  Gauge,
  HardHat,
  Layers,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const pageMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "/dashboard": { title: "Dashboard", icon: Gauge },
  "/obras": { title: "Obras", icon: HardHat },
  "/cronograma": { title: "Cronograma", icon: CalendarDays },
  "/financeiro": { title: "Financeiro", icon: CreditCard },
  "/equipes": { title: "Equipes", icon: Users },
  "/materiais": { title: "Materiais", icon: Package },
  "/diario": { title: "Diário de Obra", icon: Briefcase },
  "/qualidade": { title: "Qualidade e SSMA", icon: ShieldCheck },
  "/relatorios": { title: "Relatórios", icon: Layers },
  "/planos": { title: "Planos", icon: FolderKanban },
  "/portal": { title: "Portal do Cliente", icon: Building2 },
  "/configuracoes": { title: "Configurações", icon: Settings },
  "/contas": { title: "Gerenciamento de Contas", icon: Building2 },
};

function getPageMeta(pathname: string) {
  for (const [key, value] of Object.entries(pageMeta)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      return value;
    }
  }
  return { title: "ObrasCitY", icon: HardHat };
}

type TopbarProps = {
  summary: LayoutSummary;
  adminManagementOnly: boolean;
};

export function Topbar({ summary, adminManagementOnly }: TopbarProps) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const IconComponent = meta.icon;
  const { toggleNotif, toggleMobileSidebar, openNovaObra, notifOpen } = useAppUi();
  const count = summary.unreadNotifications;

  return (
    <header className="of-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="of-mobile-menu-btn" onClick={toggleMobileSidebar} aria-label="Menu">
          ☰
        </button>
        <h1 className="of-topbar-title">
          <IconComponent size={18} className="of-topbar-title-icon" aria-hidden />
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
          <Bell size={16} aria-hidden />
          {count > 0 ? <span className="of-btn-notif-count">{count}</span> : null}
        </button>
        {!adminManagementOnly ? (
          <button type="button" className="of-btn-primary" onClick={openNovaObra}>
            <Plus size={15} aria-hidden />
            <span>Nova Obra</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
