import { GanttView } from "@/components/cronograma/gantt-view";
import { buildGanttMonths, currentMonthIndex, ganttBarColor } from "@/lib/cronograma/gantt-utils";
import { createCronogramaAction, createDependenciaAction, gerarBaselineAction } from "./actions";
import { listCronograma, listDependenciasCronograma } from "@/lib/db/cronograma";
import { listObras } from "@/lib/db/obras";

export async function CronogramaContent() {
  const [items, obras, dependencias] = await Promise.all([
    listCronograma(),
    listObras(),
    listDependenciasCronograma(),
  ]);

  const fallbackTime = new Date("2000-01-01").getTime();
  const allDates = items.flatMap((item) => [new Date(item.inicio), new Date(item.fim)]);
  const startBoundary = allDates.length > 0 ? Math.min(...allDates.map((d) => d.getTime())) : fallbackTime;
  const endBoundary = allDates.length > 0 ? Math.max(...allDates.map((d) => d.getTime())) : fallbackTime + 1;
  const totalRange = Math.max(endBoundary - startBoundary, 1);
  const months = buildGanttMonths(startBoundary, endBoundary);
  const monthIndex = currentMonthIndex(months);

  const ganttItems = items.map((item) => {
    const start = new Date(item.inicio).getTime();
    const end = new Date(item.fim).getTime();
    const left = ((start - startBoundary) / totalRange) * 100;
    const width = (Math.max(end - start, 86_400_000) / totalRange) * 100;
    return {
      id: item.id,
      nome: item.nome,
      obra_nome: item.obra_nome,
      status: item.status,
      inicio: item.inicio,
      fim: item.fim,
      left: Math.max(0, left),
      width: Math.min(100 - left, Math.max(3, width)),
      color: ganttBarColor(item.status),
    };
  });

  return (
    <section className="of-page">
      <div className="of-gantt-controls">
        <form action={createCronogramaAction} className="of-card of-form-grid md:grid-cols-5" style={{ flex: 1 }}>
          <div className="of-card-title md:col-span-5">Nova tarefa</div>
          <select name="obra_id" required className="of-input" defaultValue="">
            <option value="" disabled>
              Selecione a obra
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <input name="nome" required placeholder="Nome da tarefa" className="of-input" />
          <input name="inicio" required type="date" className="of-input" />
          <input name="fim" required type="date" className="of-input" />
          <select name="status" className="of-input" defaultValue="planejado">
            <option value="planejado">Planejado</option>
            <option value="andamento">Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="atrasado">Atrasado</option>
          </select>
          <div className="md:col-span-5">
            <button type="submit" className="of-btn-primary">
              + Adicionar tarefa
            </button>
          </div>
        </form>
      </div>

      <div className="of-gantt-controls">
        <span className="of-gantt-period">Timeline {months[0]} — {months[months.length - 1]} {new Date().getFullYear()}</span>
        <div className="of-gantt-legend">
          <span>
            <i className="of-dot done" /> Concluído
          </span>
          <span>
            <i className="of-dot active" /> Em andamento
          </span>
          <span>
            <i className="of-dot warning" /> Atenção
          </span>
          <span>
            <i className="of-dot planned" /> Planejado
          </span>
        </div>
      </div>

      <GanttView items={ganttItems} months={months} currentMonthIndex={monthIndex} />

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={createDependenciaAction} className="of-card of-form-grid md:grid-cols-2">
          <div className="of-card-title md:col-span-2">Dependências</div>
          <select name="tarefa_predecessora_id" required defaultValue="" className="of-input">
            <option value="" disabled>
              Tarefa predecessora
            </option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.obra_nome} · {item.nome}
              </option>
            ))}
          </select>
          <select name="tarefa_sucessora_id" required defaultValue="" className="of-input">
            <option value="" disabled>
              Tarefa sucessora
            </option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.obra_nome} · {item.nome}
              </option>
            ))}
          </select>
          <select name="tipo" defaultValue="finish_to_start" className="of-input md:col-span-2">
            <option value="finish_to_start">Finish-to-start</option>
            <option value="start_to_start">Start-to-start</option>
          </select>
          <button type="submit" className="of-btn-primary md:col-span-2">
            Criar dependência
          </button>
        </form>

        <form action={gerarBaselineAction} className="of-card of-form-grid">
          <div className="of-card-title">Baseline</div>
          <select name="obra_id" required defaultValue="" className="of-input">
            <option value="" disabled>
              Obra para baseline
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <button type="submit" className="of-btn-ghost">
            Gerar snapshot baseline
          </button>
          <p className="of-empty-text">
            Dependências registradas: <strong>{dependencias.length}</strong>
          </p>
        </form>
      </div>
    </section>
  );
}
