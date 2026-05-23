import { createAdminClient } from "@/lib/supabase/admin";
import type { NotifDisplay } from "@/components/shell/notification-panel";

type MasterNotificationResult = {
  items: NotifDisplay[];
  unreadCount: number;
};

type SecurityAlertRow = {
  id: string;
  category: string;
  severity: string;
  reason: string;
  created_at: string;
};

type SupportTicketRow = {
  id: string;
  empresa_id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
};

const OPEN_TICKET_STATUSES = new Set(["aberto", "em_andamento", "aguardando_cliente"]);

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "há pouco";
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  return "ontem";
}

export async function getMasterNotifications(limit = 30): Promise<MasterNotificationResult> {
  const admin = createAdminClient();
  const [alertsCountRes, ticketsCountRes, alertsRes, ticketsRes, empresasRes] = await Promise.all([
    admin
      .from("security_alerts")
      .select("id", { head: true, count: "exact" })
      .eq("severity", "high"),
    admin
      .from("support_tickets")
      .select("id", { head: true, count: "exact" })
      .in("status", Array.from(OPEN_TICKET_STATUSES)),
    admin
      .from("security_alerts")
      .select("id, category, severity, reason, created_at")
      .eq("severity", "high")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("support_tickets")
      .select("id, empresa_id, title, category, priority, status, created_at")
      .in("status", Array.from(OPEN_TICKET_STATUSES))
      .order("created_at", { ascending: false })
      .limit(limit),
    admin.from("empresas").select("id, nome"),
  ]);

  if (alertsCountRes.error) throw new Error(alertsCountRes.error.message);
  if (ticketsCountRes.error) throw new Error(ticketsCountRes.error.message);
  if (alertsRes.error) throw new Error(alertsRes.error.message);
  if (ticketsRes.error) throw new Error(ticketsRes.error.message);

  const empresaMap = new Map<string, string>();
  for (const empresa of empresasRes.data ?? []) {
    empresaMap.set(empresa.id, empresa.nome);
  }

  const items: Array<NotifDisplay & { createdAt: number }> = [
    ...(alertsRes.data ?? []).map((row: SecurityAlertRow) => ({
      id: `alert-${row.id}`,
      titulo: `🔒 ${row.reason}`,
      descricao: `${row.category} • severidade ${row.severity}`,
      tempo: formatRelative(row.created_at),
      unread: true,
      href: "/contas?tab=seguranca",
      createdAt: new Date(row.created_at).getTime(),
    })),
    ...(ticketsRes.data ?? []).map((row: SupportTicketRow) => ({
      id: `ticket-${row.id}`,
      titulo: `🆘 ${row.title}`,
      descricao: `${empresaMap.get(row.empresa_id) ?? "Empresa"} • ${row.category} • ${row.priority} • ${row.status}`,
      tempo: formatRelative(row.created_at),
      unread: OPEN_TICKET_STATUSES.has(row.status),
      href: "/contas?tab=suporte",
      createdAt: new Date(row.created_at).getTime(),
    })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  return {
    items: items.slice(0, limit),
    unreadCount: (alertsCountRes.count ?? 0) + (ticketsCountRes.count ?? 0),
  };
}
