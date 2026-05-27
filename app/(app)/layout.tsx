import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import type { LayoutSummary } from "@/lib/db/layout-summary";
import { getLayoutSummary } from "@/lib/db/layout-summary";
import { listNotificacoes } from "@/lib/db/notificacoes";
import { getMasterNotifications } from "@/lib/db/master-notifications";
import { listEquipes } from "@/lib/db/equipes";
import { supportsObraTrash } from "@/lib/db/obras";
import { mapDbNotifications } from "@/lib/notifications/map";
import { validateAndTouchTenantSession } from "@/lib/db/seguranca-corporativa";
import { getRequestIpFromHeaders, isMasterIpAllowed } from "@/lib/auth/master-access";
import { encerrarAcessoAssistidoAction } from "./contas/actions";

export const dynamic = "force-dynamic";

function buildFallbackSummary(userEmail: string | null | undefined, profile: Awaited<ReturnType<typeof getCurrentProfile>>) {
  const userName =
    profile?.nome ??
    userEmail?.split("@")[0] ??
    "Administrador";
  const userRole =
    profile?.role ??
    "Administrador";
  const initials = userName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("") || "OF";

  return {
    userName,
    userRole,
    userInitials: initials,
    unreadNotifications: 0,
    materiaisCriticos: 0,
  } satisfies LayoutSummary;
}

async function loadTenantNotifications() {
  try {
    return await listNotificacoes();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar notificações.";
    return [
      {
        id: "notifications-load-error",
        titulo: `Falha ao carregar notificações: ${message}`,
        lida: false,
        link: "/configuracoes",
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let profile = null;
  const appWarnings: string[] = [];

  try {
    profile = await getCurrentProfile();
  } catch (error) {
    appWarnings.push(error instanceof Error ? error.message : "Erro ao carregar perfil.");
  }

  const requestIp = getRequestIpFromHeaders(await headers());
  if (isControlTotalOwner(profile) && !isMasterIpAllowed(requestIp)) {
    redirect("/login");
  }

  const canAccessControlTotal = isControlTotalOwner(profile);
  if (profile && !profile.empresa_id && !canAccessControlTotal) {
    redirect("/conta-pendente");
  }

  if (profile?.empresa_id) {
    const cookieStore = await cookies();
    const tenantSessionId = cookieStore.get("of_tenant_session")?.value ?? null;
    if (tenantSessionId) {
      try {
        const sessionStatus = await validateAndTouchTenantSession({
          empresaId: profile.empresa_id,
          sessionId: tenantSessionId,
        });
        if (!sessionStatus.valid) {
          cookieStore.delete("of_tenant_session");
          redirect("/login");
        }
      } catch (error) {
        appWarnings.push(
          error instanceof Error
            ? error.message
            : "Não foi possível validar a sessão do tenant.",
        );
      }
    }
  }

  const adminManagementOnly = canAccessControlTotal;
  const previewSessionId = (await cookies()).get("of_support_preview_session_id")?.value ?? null;

  const [summaryResult, notificacoesResult, masterNotificationsResult, equipesResult, trashEnabledResult] = await Promise.allSettled([
    getLayoutSummary(),
    loadTenantNotifications(),
    adminManagementOnly ? getMasterNotifications() : Promise.resolve(null),
    listEquipes(),
    supportsObraTrash(),
  ]);

  const fallbackSummary = buildFallbackSummary(user.email, profile);
  const summary =
    summaryResult.status === "fulfilled"
      ? summaryResult.value
      : (appWarnings.push(
          summaryResult.reason instanceof Error
            ? summaryResult.reason.message
            : "Falha ao carregar resumo do layout.",
        ), fallbackSummary);
  const notificacoes =
    notificacoesResult.status === "fulfilled"
      ? notificacoesResult.value
      : (appWarnings.push("Falha ao carregar notificações do tenant."), []);
  const masterNotifications =
    masterNotificationsResult.status === "fulfilled"
      ? masterNotificationsResult.value
      : (appWarnings.push("Falha ao carregar notificações da conta master."), null);
  const equipes =
    equipesResult.status === "fulfilled"
      ? equipesResult.value
      : (appWarnings.push("Falha ao carregar equipes."), []);
  const trashEnabled =
    trashEnabledResult.status === "fulfilled"
      ? trashEnabledResult.value
      : (appWarnings.push("Falha ao verificar suporte da lixeira de obras."), false);

  const notifications = adminManagementOnly
    ? masterNotifications?.items ?? []
    : mapDbNotifications(notificacoes);
  const layoutSummary =
    adminManagementOnly && masterNotifications
      ? { ...summary, unreadNotifications: masterNotifications.unreadCount }
      : summary;

  return (
    <>
      {appWarnings.length > 0 ? (
        <article
          className="of-card"
          style={{
            margin: "16px",
            borderColor: "var(--of-yellow)",
            background: "rgba(255, 209, 102, 0.08)",
          }}
        >
          <div className="of-card-title">Carregamento parcial</div>
          <p className="of-empty-text">{appWarnings.join(" ")}</p>
        </article>
      ) : null}
      {previewSessionId ? (
        <article
          className="of-card"
          style={{
            margin: "16px",
            borderColor: "var(--of-blue)",
            background: "rgba(88, 166, 255, 0.08)",
          }}
        >
          <div className="of-card-title">Modo de acesso assistido</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <p className="of-empty-text" style={{ margin: 0 }}>
              Você está visualizando um tenant em modo assistido. Use o botão para voltar ao console master.
            </p>
            <form action={encerrarAcessoAssistidoAction}>
              <button type="submit" className="of-btn-primary">
                Encerrar acesso assistido
              </button>
            </form>
          </div>
        </article>
      ) : null}
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
    </>
  );
}
