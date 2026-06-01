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
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/app/actions";

type DeviceClass = "mobile" | "tablet" | "desktop";

function detectDeviceClass(): DeviceClass {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  const isTabletUa =
    ua.includes("ipad") ||
    ua.includes("tablet") ||
    ua.includes("playbook") ||
    ua.includes("silk") ||
    (ua.includes("android") && !ua.includes("mobile"));

  const isMobileUa =
    ua.includes("mobi") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("blackberry") ||
    ua.includes("opera mini") ||
    ua.includes("iemobile") ||
    ua.includes("phone");

  if (isTabletUa || (width >= 768 && width <= 1100)) return "tablet";
  if (isMobileUa || width < 768) return "mobile";
  return "desktop";
}

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

  useEffect(() => {
    const applyDeviceClass = () => {
      const device = detectDeviceClass();
      const root = document.documentElement;
      root.setAttribute("data-device", device);
      root.classList.remove("device-mobile", "device-tablet", "device-desktop");
      root.classList.add(`device-${device}`);
    };

    applyDeviceClass();
    window.addEventListener("resize", applyDeviceClass);
    return () => window.removeEventListener("resize", applyDeviceClass);
  }, []);

  const blockedByAdminView = adminManagementOnly && !pathname.startsWith("/contas");

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsReadAction();
  };

  return (
    <AppUiProvider trashEnabled={trashEnabled}>
      <div className="of-app-shell">
        <a href="#of-main-content" className="of-skip-link">
          Pular para o conteúdo principal
        </a>
        <Sidebar
          summary={summary}
          canAccessControlTotal={canAccessControlTotal}
          adminManagementOnly={adminManagementOnly}
        />
        <div className="of-main-shell">
          <Topbar summary={summary} adminManagementOnly={adminManagementOnly} />
          <main id="of-main-content" className="of-main-content of-page-enter">{blockedByAdminView ? null : children}</main>
        </div>
      </div>
      <NotificationPanel 
        items={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
      {!adminManagementOnly ? <NovaObraModal /> : null}
      {!adminManagementOnly ? <AddMemberModal equipes={equipes} /> : null}
      <DetailPanel />
    </AppUiProvider>
  );
}
