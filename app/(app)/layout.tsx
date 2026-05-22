import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { getLayoutSummary } from "@/lib/db/layout-summary";
import { listNotificacoes } from "@/lib/db/notificacoes";
import { listEquipes } from "@/lib/db/equipes";
import { supportsObraTrash } from "@/lib/db/obras";
import { mapDbNotifications } from "@/lib/demo/notifications-fallback";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile?.empresa_id) {
    redirect("/conta-pendente");
  }

  const [summary, notificacoes, equipes, trashEnabled] = await Promise.all([
    getLayoutSummary(),
    listNotificacoes(),
    listEquipes(),
    supportsObraTrash(),
  ]);

  const notifications = mapDbNotifications(notificacoes);

  return (
    <AppShell summary={summary} notifications={notifications} equipes={equipes} trashEnabled={trashEnabled}>
      {children}
    </AppShell>
  );
}
