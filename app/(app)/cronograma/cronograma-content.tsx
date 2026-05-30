import { GanttView } from "@/components/cronograma/gantt-view";
import { buildGanttMonths, currentMonthIndex, ganttBarColor } from "@/lib/cronograma/gantt-utils";
import {
  createCronogramaAction,
  createDependenciaAction,
  createReplanejamentoAction,
  deleteCronogramaAction,
  gerarBaselineAction,
  updateCronogramaAction,
} from "./actions";
import { listCaminhoCritico, listCronograma, listDependenciasCronograma, listReplanejamentos } from "@/lib/db/cronograma";
import { listObras } from "@/lib/db/obras";

function cronogramaStatusLabel(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "concluido") return "Concluído";
  if (value === "andamento") return "Em andamento";
  if (value === "atrasado") return "Atrasado";
  if (value === "cancelado") return "Cancelado";
  return "Planejado";
}

function cronogramaStatusTone(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "concluido") return "done";
  if (value === "andamento") return "active";
  if (value === "atrasado") return "warning";
  if (value === "cancelado") return "muted";
  return "planned";
}

export async function CronogramaContent() {
  const [items, obras, dependencias, caminhoCritico, replanejamentos] = await Promise.all([
    listCronograma(),
    listObras(),
    listDependenciasCronograma(),
    listCaminhoCritico(),
    listReplanejamentos(),
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
              Adicionar tarefa
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

      <article className="of-card">
        <div className="of-card-title">Tarefas do cronograma (edição rápida)</div>
        <div className="of-crono-edit-list">
          {items.map((item) => (
            <div className="of-crono-edit-item" key={item.id}>
              <div className="of-crono-edit-head">
                <p className="of-crono-edit-obra">{item.obra_nome}</p>
                <span className={`of-crono-status-badge ${cronogramaStatusTone(item.status)}`}>
                  {cronogramaStatusLabel(item.status)}
                </span>
              </div>

              <form action={updateCronogramaAction} className="of-crono-edit-form">
                <input type="hidden" name="tarefa_id" value={item.id} />
                <div className="of-crono-edit-grid">
                  <div className="of-crono-field">
                    <label className="of-crono-field-label">Tarefa</label>
                    <input name="nome" defaultValue={item.nome} className="of-input" />
                  </div>
                  <div className="of-crono-field">
                    <label className="of-crono-field-label">Início</label>
                    <input name="inicio" type="date" defaultValue={item.inicio} className="of-input" />
                  </div>
                  <div className="of-crono-field">
                    <label className="of-crono-field-label">Fim</label>
                    <input name="fim" type="date" defaultValue={item.fim} className="of-input" />
                  </div>
                  <div className="of-crono-field">
                    <label className="of-crono-field-label">Status</label>
                    <select name="status" defaultValue={item.status} className="of-input">
                      <option value="planejado">Planejado</option>
                      <option value="andamento">Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="atrasado">Atrasado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="of-crono-edit-actions">
                  <button type="submit" className="of-btn-primary">
                    Salvar alterações
                  </button>
                  <span className="of-mono">
                    {item.inicio} → {item.fim}
                  </span>
                </div>
              </form>

              <form action={deleteCronogramaAction} className="of-crono-delete-form">
                <input type="hidden" name="tarefa_id" value={item.id} />
                <button type="submit" className="of-btn-ghost">
                  Excluir tarefa
                </button>
              </form>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="of-empty-text" style={{ margin: 0 }}>
              Nenhuma tarefa cadastrada.
            </p>
          ) : null}
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="of-card">
          <div className="of-card-title">Caminho crítico (top duração)</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Tarefa</th>
                  <th>Duração</th>
                  <th>Dependências</th>
                </tr>
              </thead>
              <tbody>
                {caminhoCritico.map((item) => (
                  <tr key={item.tarefa_id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.nome}</td>
                    <td className="of-mono">{item.duracao_dias} dias</td>
                    <td className="of-mono">{item.dependencias}</td>
                  </tr>
                ))}
                {caminhoCritico.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="of-empty-text">
                      Cadastre tarefas para calcular o caminho crítico.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card">
          <div className="of-card-title">Replanejamento</div>
          <form action={createReplanejamentoAction} className="of-form-grid" style={{ marginBottom: 18 }}>
            <select name="obra_id" required className="of-input" defaultValue="">
              <option value="" disabled>
                Obra impactada
              </option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </select>
            <input name="motivo" required className="of-input" placeholder="Motivo do replanejamento" />
            <div className="of-inline-grid-2">
              <input
                name="impacto_prazo_dias"
                type="number"
                min={0}
                defaultValue={0}
                className="of-input"
                placeholder="Impacto em dias"
              />
              <input
                name="impacto_custo"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
                className="of-input"
                placeholder="Impacto financeiro"
              />
            </div>
            <button type="submit" className="of-btn-primary">
              Registrar replanejamento
            </button>
          </form>

          <div className="of-replan-divider" />

          <div className="of-replan-header">
            <h4 className="of-replan-title">Histórico ({replanejamentos.length})</h4>
          </div>

          {replanejamentos.length > 0 ? (
            <div className="of-replan-list">
              {replanejamentos.map((item) => (
                <div className="of-replan-item" key={item.id}>
                  <div className="of-replan-head">
                    <p className="of-replan-obra">{item.obra_nome}</p>
                    <span className="of-replan-date">{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p className="of-replan-motivo">{item.motivo}</p>
                  <div className="of-replan-impacts">
                    <div className="of-replan-impact">
                      <span className="of-replan-label">Impacto em prazo</span>
                      <span className="of-replan-value">{item.impacto_prazo_dias} dias</span>
                    </div>
                    <div className="of-replan-impact">
                      <span className="of-replan-label">Impacto financeiro</span>
                      <span className="of-replan-value">R$ {item.impacto_custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="of-replan-impact">
                      <span className="of-replan-label">Status</span>
                      <span className={`of-replan-status ${item.status}`}>{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="of-empty-text" style={{ margin: 0, padding: "12px 0" }}>
              Nenhum replanejamento registrado.
            </p>
          )}
        </article>
      </div>

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
