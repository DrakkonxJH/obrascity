type GanttChartProps = {
  totalTasks: number;
};

export function GanttChart({ totalTasks }: GanttChartProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
      Gantt baseline carregado. Tarefas ativas: {totalTasks}.
    </div>
  );
}
