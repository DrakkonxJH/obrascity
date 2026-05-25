import type { NotifDisplay } from "@/components/shell/notification-panel";

export function mapDbNotifications(
  rows: Array<{ id: string; titulo: string; lida: boolean; link: string | null; created_at: string }>,
): NotifDisplay[] {
  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    descricao: row.link ? "Toque para abrir" : "Notificação do sistema",
    tempo: formatRelative(row.created_at),
    unread: !row.lida,
    href: row.link ?? undefined,
  }));
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "há pouco";
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  return "ontem";
}
