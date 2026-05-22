"use client";

import type { ReactNode } from "react";
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
  children: ReactNode;
};

export function AppShell({ summary, notifications, equipes, trashEnabled, children }: AppShellProps) {
  return (
    <AppUiProvider trashEnabled={trashEnabled}>
      <div className="of-app-shell">
        <Sidebar summary={summary} />
        <div className="of-main-shell">
          <Topbar summary={summary} />
          <main className="of-main-content of-page-enter">{children}</main>
        </div>
      </div>
      <NotificationPanel items={notifications} />
      <NovaObraModal />
      <AddMemberModal equipes={equipes} />
      <DetailPanel />
    </AppUiProvider>
  );
}
