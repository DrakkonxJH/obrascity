"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LayoutSummary } from "@/lib/db/layout-summary";
import { signOut } from "@/lib/auth/actions";
import { useAppUi } from "@/components/shell/app-ui-provider";
import {
  BellDot,
  BookMarked,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Search,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Globe,
  Hammer,
  HardHat,
  HelpCircle,
  Layers,
  LogOut,
  Package,
  Plug,
  RefreshCw,
  Rocket,
  ScrollText,
  Settings,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Users2,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; newTab?: boolean };
type NavSection = { title: string; items: NavItem[] };

export function buildNavSections(canAccessControlTotal: boolean, adminManagementOnly: boolean): NavSection[] {
  if (adminManagementOnly) {
    return [
      {
        title: "SaaS",
        items: [
          { href: "/contas?tab=empresas", label: "Clientes (Empresas)", icon: Building2 },
          { href: "/contas?tab=usuarios", label: "Usuários da Plataforma", icon: Users },
          { href: "/contas?tab=faturamento", label: "Faturamento e Planos", icon: FolderKanban },
        ],
      },
      {
        title: "Operacao",
        items: [
          { href: "/contas?tab=operacao", label: "Operação e SLO", icon: TrendingUp },
          { href: "/contas?tab=suporte", label: "Suporte e SLA", icon: BellDot },
          { href: "/contas?tab=integracoes", label: "Integrações", icon: Plug },
          { href: "/contas?tab=deploy", label: "Deploy e Domínio", icon: Rocket },
          { href: "/contas?tab=seguranca", label: "Segurança", icon: ShieldCheck },
          { href: "/contas?tab=auditoria", label: "Auditoria", icon: ScrollText },
          { href: "/contas?tab=runbooks", label: "Runbooks", icon: BookMarked },
          { href: "/contas?tab=terminal", label: "Terminal TI", icon: Wrench },
        ],
      },
    ];
  }

  const sections: NavSection[] = [
    {
      title: "Principal",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: Gauge },
        { href: "/obras", label: "Obras", icon: HardHat },
        { href: "/cronograma", label: "Cronograma", icon: CalendarDays },
      ],
    },
    {
      title: "Gestão",
      items: [
        { href: "/viabilidade", label: "Viabilidade", icon: Search },
        { href: "/crm-workspace", label: "CRM", icon: Users2, newTab: true },
        { href: "/projetos", label: "Projetos", icon: FileText },
        { href: "/financeiro", label: "Financeiro", icon: CreditCard },
        { href: "/equipes", label: "Equipes", icon: Users },
        { href: "/materiais", label: "Materiais", icon: Package },
        { href: "/mudancas", label: "Mudanças", icon: RefreshCw },
        { href: "/diario", label: "Diário", icon: Briefcase },
        { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
        { href: "/entrega", label: "Entrega", icon: ClipboardCheck },
        { href: "/garantia", label: "Garantia", icon: Hammer },
        { href: "/relatorios", label: "Relatórios", icon: Layers },
      ],
    },
  ];

  if (canAccessControlTotal) {
    sections.push({
      title: "Gestão de Contas",
      items: [
        { href: "/contas", label: "Todas as Contas", icon: Building2 },
      ],
    });
  }

  sections.push({
    title: "Sistema",
    items: [
      { href: "/planos", label: "Planos", icon: FolderKanban },
      { href: "/portal", label: "Portal do Cliente", icon: Globe },
      { href: "/suporte", label: "SAC e Guia", icon: HelpCircle },
      { href: "/governanca", label: "Governança", icon: ScrollText },
      { href: "/seguranca-corporativa", label: "Segurança Corporativa", icon: ShieldCheck },
      { href: "/mobile-campo", label: "Mobile Campo", icon: Smartphone },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  });

  return sections;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  summary: LayoutSummary;
  canAccessControlTotal: boolean;
  adminManagementOnly: boolean;
};

export function Sidebar({ summary, canAccessControlTotal, adminManagementOnly }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, closeMobileSidebar } = useAppUi();
  const navSections = buildNavSections(canAccessControlTotal, adminManagementOnly);

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
              <div className="of-sidebar-brand-icon">
                <HardHat size={20} aria-hidden />
              </div>
              <div className="of-sidebar-brand-text of-sidebar-logo-text">
                Obras<span>CitY</span>
              </div>
            </div>
            <button
              type="button"
              className="of-sidebar-toggle"
              onClick={toggleSidebar}
              title="Recolher menu"
              aria-label="Recolher menu"
            >
              {sidebarCollapsed ? <ChevronRight size={16} aria-hidden /> : <ChevronLeft size={16} aria-hidden />}
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
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`of-nav-item ${active ? "active" : ""}`}
                    onClick={closeMobileSidebar}
                    target={item.newTab ? "_blank" : undefined}
                    rel={item.newTab ? "noopener noreferrer" : undefined}
                  >
                    <span className="of-nav-icon" aria-hidden>
                      <IconComponent size={18} strokeWidth={2} />
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
              <LogOut size={15} aria-hidden />
              <span className="of-sidebar-logout-text">Sair da conta</span>
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
}
