import type { NotifDisplay } from "@/components/shell/notification-panel";

export const demoNotificationsFallback: NotifDisplay[] = [
  {
    id: "demo-1",
    titulo: "🚨 Atraso crítico — obra em atenção",
    descricao: "Revise o cronograma e acione a equipe responsável.",
    tempo: "há 1 hora",
    unread: true,
    href: "/obras",
  },
  {
    id: "demo-2",
    titulo: "⚠️ Estoque baixo de materiais",
    descricao: "Materiais abaixo do mínimo recomendado.",
    tempo: "há 3 horas",
    unread: true,
    href: "/materiais",
  },
  {
    id: "demo-3",
    titulo: "💸 Orçamento próximo do limite",
    descricao: "Consumo financeiro acima de 85% em alguma obra.",
    tempo: "há 5 horas",
    unread: true,
    href: "/financeiro",
  },
  {
    id: "demo-4",
    titulo: "✅ Medição aprovada",
    descricao: "Nova medição registrada no financeiro.",
    tempo: "ontem, 14h",
    unread: false,
    href: "/financeiro",
  },
];

export function mapDbNotifications(
  rows: Array<{ id: string; titulo: string; lida: boolean; link: string | null; created_at: string }>,
): NotifDisplay[] {
  if (rows.length === 0) return demoNotificationsFallback;

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
