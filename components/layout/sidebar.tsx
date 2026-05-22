"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LayoutSummary } from "@/lib/db/layout-summary";
import { signOut } from "@/lib/auth/actions";
import { useAppUi } from "@/components/shell/app-ui-provider";

type NavItem = { href: string; label: string; icon: string; badge?: number };

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "📊" },
      { href: "/obras", label: "Obras", icon: "🏗️" },
      { href: "/cronograma", label: "Cronograma", icon: "📅" },
    ],
  },
  {
    title: "Gestão",
      items: [
        { href: "/financeiro", label: "Financeiro", icon: "💰" },
        { href: "/equipes", label: "Equipes", icon: "👥" },
        { href: "/materiais", label: "Materiais", icon: "📦" },
        { href: "/qualidade", label: "Qualidade", icon: "🛡️" },
        { href: "/relatórios", label: "Relatórios", icon: "📋" },
      ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/planos", label: "Planos", icon: "⭐" },
      { href: "/contas", label: "Contas", icon: "🧾" },
      { href: "/portal", label: "Portal do Cliente", icon: "🌐" },
      { href: "/suporte", label: "SAC e Guia", icon: "🆘" },
      { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  summary: LayoutSummary;
};

export function Sidebar({ summary }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, closeMobileSidebar } = useAppUi();

  const materiaisBadge = summary.materiaisCriticos > 0 ? summary.materiaisCriticos : undefined;

  return (
    <>
      <button
        type="button"
        className={`of-sidebar-backdrop ${mobileSidebarOpen ? "open" : ""}`}
        aria-label="Fechar menu"
        onClick={closeMobileSidebar}
      />
      <aside
        className={`of-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}
      >
        <div className="of-sidebar-header">
          <div className="of-sidebar-header-row" style={{ width: "100%" }}>
            <div className="of-sidebar-brand">
              <div className="of-sidebar-brand-icon">🏗</div>
              <div className="of-sidebar-brand-text of-sidebar-logo-text">
                Obras<span>Flow</span>
              </div>
            </div>
            <button
              type="button"
              className="of-sidebar-toggle"
              onClick={toggleSidebar}
              title="Recolher menu"
              aria-label="Recolher menu"
            >
              {sidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>
        </div>

        <nav className="of-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title} className="of-sidebar-section">
              <p className="of-sidebar-section-title">{section.title}</p>
              {section.items.map((item) => {
                const badge =
                  item.href === "/materiais" ? materiaisBadge : item.badge;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`of-nav-item ${active ? "active" : ""}`}
                    onClick={closeMobileSidebar}
                  >
                    <span className="of-nav-icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="of-nav-label">{item.label}</span>
                    {badge ? <span className="of-nav-badge">{badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <footer className="of-sidebar-footer">
          <div className="of-user-card">
            <div className="of-user-avatar">{summary.userInitials}</div>
            <div className="of-user-details">
              <p className="of-user-name">{summary.userName}</p>
              <p className="of-user-role">{summary.userRole}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="of-sidebar-logout">
              <span className="of-sidebar-logout-text">↩ Sair da conta</span>
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
}
