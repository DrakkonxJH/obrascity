import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { getLayoutSummary } from "@/lib/db/layout-summary";
import { listNotificacoes } from "@/lib/db/notificacoes";
import { getMasterNotifications } from "@/lib/db/master-notifications";
import { listEquipes } from "@/lib/db/equipes";
import { supportsObraTrash } from "@/lib/db/obras";
import { mapDbNotifications } from "@/lib/demo/notifications-fallback";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const canAccessControlTotal = isControlTotalOwner(profile);
  if (!profile?.empresa_id && !canAccessControlTotal) {
    redirect("/conta-pendente");
  }
  const adminManagementOnly = canAccessControlTotal;

  const [summary, notificacoes, masterNotifications, equipes, trashEnabled] = await Promise.all([
    getLayoutSummary(),
    listNotificacoes(),
    adminManagementOnly ? getMasterNotifications() : Promise.resolve(null),
    listEquipes(),
    supportsObraTrash(),
  ]);

  const notifications = adminManagementOnly
    ? masterNotifications?.items ?? []
    : mapDbNotifications(notificacoes);
  const layoutSummary = adminManagementOnly && masterNotifications
    ? { ...summary, unreadNotifications: masterNotifications.unreadCount }
    : summary;

  return (
    <AppShell
      summary={layoutSummary}
      notifications={notifications}
      equipes={equipes}
      trashEnabled={trashEnabled}
      canAccessControlTotal={canAccessControlTotal}
      adminManagementOnly={adminManagementOnly}
    >
      {children}
    </AppShell>
  );
}
