const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function buildGanttMonths(startMs: number, endMs: number) {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);
  const months: string[] = [];

  while (cursor <= limit) {
    months.push(MONTH_LABELS[cursor.getMonth()] ?? "—");
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (months.length === 0) {
    return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];
  }

  return months;
}

export function currentMonthIndex(months: string[]) {
  const current = MONTH_LABELS[new Date().getMonth()];
  const index = months.indexOf(current);
  return index >= 0 ? index : Math.floor(months.length / 2);
}

export function ganttBarColor(status: string) {
  if (status === "concluido") return "var(--of-green)";
  if (status === "atrasado") return "var(--of-yellow)";
  if (status === "andamento") return "var(--of-blue)";
  return "var(--of-bg-4)";
}
