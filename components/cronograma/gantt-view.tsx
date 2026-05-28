"use client";

type GanttItem = {
  id: string;
  nome: string;
  obra_nome: string;
  status: string;
  inicio: string;
  fim: string;
  left: number;
  width: number;
  color: string;
};

type GanttViewProps = {
  items: GanttItem[];
  months: string[];
  currentMonthIndex: number;
};

function barClass(status: string) {
  if (status === "concluido") return "done";
  if (status === "atrasado") return "warning";
  if (status === "andamento") return "active";
  return "planned";
}

export function GanttView({ items, months, currentMonthIndex }: GanttViewProps) {
  const colCount = Math.max(months.length, 1);
  const monthColumnPx = 128;
  const timelineMinWidth = Math.max(colCount * monthColumnPx, 840);
  const ganttMinWidth = 220 + 90 + timelineMinWidth;

  return (
    <div className="of-gantt-wrapper">
      <div className="of-gantt-scroll-area">
        <div style={{ minWidth: ganttMinWidth }}>
          <div
            className="of-gantt-head-extended"
            style={{ display: "grid", gridTemplateColumns: "220px 90px 1fr", background: "var(--of-bg-3)" }}
          >
            <div style={{ padding: "10px 14px", fontSize: "0.7rem", fontWeight: 700, color: "var(--of-text-2)", textTransform: "uppercase" }}>
              Tarefa
            </div>
            <div style={{ padding: "10px 14px", fontSize: "0.7rem", fontWeight: 700, color: "var(--of-text-2)", textTransform: "uppercase" }}>
              Status
            </div>
            <div className="of-gantt-months" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(${monthColumnPx}px, 1fr))` }}>
              {months.map((month, index) => (
                <div key={month} className={`of-gantt-month-cell ${index === currentMonthIndex ? "current" : ""}`}>
                  {month}
                </div>
              ))}
            </div>
          </div>

          <div>
            {items.map((item) => (
              <div
                key={item.id}
                className="of-gantt-row of-gantt-row-extended"
                style={{ display: "grid", gridTemplateColumns: "220px 90px 1fr", alignItems: "center" }}
              >
                <div style={{ padding: "10px 14px" }}>
                  <p className="of-gantt-task">{item.nome}</p>
                  <p className="of-gantt-task-sub">{item.obra_nome}</p>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <span className="of-badge of-badge-blue">{item.status}</span>
                </div>
                <div className="of-gantt-timeline-cell" style={{ position: "relative", height: 48, overflow: "hidden" }}>
                  <div className="of-gantt-grid-cols" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(${monthColumnPx}px, 1fr))` }}>
                    {months.map((month, index) => (
                      <div key={month} className={`of-gantt-col-line ${index === currentMonthIndex ? "current" : ""}`} />
                    ))}
                  </div>
                  <div
                    className={`of-gantt-bar-inner of-gantt-bar ${barClass(item.status)}`}
                    style={{
                      left: `${item.left}%`,
                      width: `${item.width}%`,
                      background: item.color,
                    }}
                  >
                    {item.nome}
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 ? <p className="of-empty-text" style={{ padding: 16 }}>Nenhuma tarefa cadastrada.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

