"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LayoutSummary } from "@/lib/db/layout-summary";
import type { EquipeItem } from "@/lib/db/equipes";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AppUiProvider } from "./app-ui-provider";
import { DetailPanel } from "./detail-panel";
import { NotificationPanel, type NotifDisplay } from "./notification-panel";
import { NovaObraModal } from "./nova-obra-modal";
import { AddMemberModal } from "./add-member-modal";

type AppShellProps = {
  summary: LayoutSummary;
  notifications: NotifDisplay[];
  equipes: EquipeItem[];
  trashEnabled: boolean;
  canAccessControlTotal: boolean;
  adminManagementOnly: boolean;
  children: ReactNode;
};

export function AppShell({
  summary,
  notifications,
  equipes,
  trashEnabled,
  canAccessControlTotal,
  adminManagementOnly,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (adminManagementOnly && !pathname.startsWith("/contas")) {
      router.replace("/contas");
    }
  }, [adminManagementOnly, pathname, router]);

  const blockedByAdminView = adminManagementOnly && !pathname.startsWith("/contas");

  return (
    <AppUiProvider trashEnabled={trashEnabled}>
      <div className="of-app-shell">
        <Sidebar
          summary={summary}
          canAccessControlTotal={canAccessControlTotal}
          adminManagementOnly={adminManagementOnly}
        />
        <div className="of-main-shell">
          <Topbar summary={summary} adminManagementOnly={adminManagementOnly} />
          <main className="of-main-content of-page-enter">{blockedByAdminView ? null : children}</main>
        </div>
      </div>
      <NotificationPanel items={notifications} />
      {!adminManagementOnly ? <NovaObraModal /> : null}
      {!adminManagementOnly ? <AddMemberModal equipes={equipes} /> : null}
      <DetailPanel />
    </AppUiProvider>
  );
}
