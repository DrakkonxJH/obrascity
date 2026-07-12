import Link from "next/link";
import { GanttView } from "@/components/templates/gantt-view";
import { PageHeader } from "@/components/molecules/page-header";
import { buildGanttMonths, currentMonthIndex, ganttBarColor } from "@/lib/cronograma/gantt-utils";
import {
  createCronogramaAction,
  createDependenciaAction,
  createReplanejamentoAction,
  deleteCronogramaAction,
  gerarBaselineAction,
  updateCronogramaAction,
} from "./actions";
import {
  listCaminhoCritico,
  listCronograma,
  listDependenciasCronograma,
  listLatestBaseline,
  listReplanejamentos,
} from "@/lib/db/cronograma";
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

type CronogramaContentProps = {
  obraId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  view?: string;
  ok?: string;
};

const PAGE_SIZE = 12;
const getCurrentTimeMs = () => Date.now();
const safeDateMs = (value: string) => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

export async function CronogramaContent({
  obraId = "",
  status = "",
  dateFrom = "",
  dateTo = "",
  page = "1",
  view = "visao",
  ok = "",
}: CronogramaContentProps) {
  const [items, obras, dependencias, caminhoCritico, replanejamentos, baselines] = await Promise.all([
    listCronograma(),
    listObras(),
    listDependenciasCronograma(),
    listCaminhoCritico(),
    listReplanejamentos(),
    listLatestBaseline(),
  ]);

  const selectedObraId = obraId.trim();
  const selectedStatus = status.trim();
  const selectedDateFrom = dateFrom.trim();
  const selectedDateTo = dateTo.trim();
  const selectedView = ["visao", "operacao", "governanca"].includes(view) ? view : "visao";
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);

  const returnTo = `/cronograma?obra_id=${encodeURIComponent(selectedObraId)}&status=${encodeURIComponent(selectedStatus)}&date_from=${encodeURIComponent(selectedDateFrom)}&date_to=${encodeURIComponent(selectedDateTo)}&view=${encodeURIComponent(selectedView)}&page=${pageNum}`;

  const filterByObra = (obra: string) => (selectedObraId ? obra === selectedObraId : true);
  const filterByStatus = (s: string) => (selectedStatus ? s === selectedStatus : true);

  const isInDateRange = (inicio: string, fim: string) => {
    const start = new Date(inicio).getTime();
    const end = new Date(fim).getTime();
    const from = selectedDateFrom ? new Date(selectedDateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const to = selectedDateTo ? new Date(selectedDateTo).getTime() : Number.POSITIVE_INFINITY;
    return end >= from && start <= to;
  };

  const filteredItems = items
    .filter((item) => filterByObra(item.obraId))
    .filter((item) => filterByStatus(item.status))
    .filter((item) => isInDateRange(item.inicio, item.fim));

  const filteredCaminhoCritico = caminhoCritico
    .filter((item) => filterByObra(item.obraId))
    .filter((item) => isInDateRange(item.inicio, item.fim));

  const filteredReplanejamentos = replanejamentos.filter((item) => filterByObra(item.obraId));

  const tarefasIds = new Set(filteredItems.map((item) => item.id));
  const filteredDependencias = dependencias.filter(
    (item) => tarefasIds.has(item.tarefaPredecessoraId) || tarefasIds.has(item.tarefaSucessoraId),
  );

  const totalTarefas = filteredItems.length;
  const tarefasConcluidas = filteredItems.filter((item) => item.status.toLowerCase() === "concluido").length;
  const tarefasAndamento = filteredItems.filter((item) => item.status.toLowerCase() === "andamento").length;
  const tarefasAtrasadas = filteredItems.filter((item) => item.status.toLowerCase() === "atrasado").length;
  const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

  const now = getCurrentTimeMs();
  const sevenDays = 7 * 86_400_000;
  const vencendo7dias = filteredItems.filter((item) => {
    const fim = new Date(item.fim).getTime();
    return fim >= now && fim <= now + sevenDays && item.status !== "concluido";
  }).length;

  const atrasoMedioDias = (() => {
    const atrasadas = filteredItems.filter((item) => item.status === "atrasado");
    if (!atrasadas.length) return 0;
    const total = atrasadas.reduce((acc, item) => {
      const diff = Math.ceil((now - new Date(item.fim).getTime()) / 86_400_000);
      return acc + Math.max(0, diff);
    }, 0);
    return Math.round((total / atrasadas.length) * 10) / 10;
  })();

  const baselineByTaskId = new Map(baselines.map((item) => [item.tarefaId, item]));
  const baselineComparativo = filteredItems.map((item) => {
    const baseline = baselineByTaskId.get(item.id);
    if (!baseline) {
      return { ...item, baselineVersao: null as number | null, desvioDias: null as number | null };
    }
    const atualFim = new Date(item.fim).getTime();
    const baseFim = new Date(baseline.baselineFim).getTime();
    const desvioDias = Math.round((atualFim - baseFim) / 86_400_000);
    return { ...item, baselineVersao: baseline.versao, desvioDias };
  });

  const paginatedItems = filteredItems.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const prevPage = Math.max(1, pageNum - 1);
  const nextPage = Math.min(totalPages, pageNum + 1);

  const fallbackTime = new Date("2000-01-01").getTime();
  const validItemsForTimeline = filteredItems.filter((item) => safeDateMs(item.inicio) !== null && safeDateMs(item.fim) !== null);
  const invalidTimelineCount = filteredItems.length - validItemsForTimeline.length;
  const allDates = validItemsForTimeline.flatMap((item) => [safeDateMs(item.inicio) ?? fallbackTime, safeDateMs(item.fim) ?? fallbackTime]);
  const startBoundary = allDates.length > 0 ? Math.min(...allDates) : fallbackTime;
  const endBoundary = allDates.length > 0 ? Math.max(...allDates) : fallbackTime + 1;
  const totalRange = Math.max(endBoundary - startBoundary, 1);
  const months = buildGanttMonths(startBoundary, endBoundary);
  const monthIndex = currentMonthIndex(months);

  const ganttItems = validItemsForTimeline.map((item) => {
    const start = safeDateMs(item.inicio) ?? startBoundary;
    const end = safeDateMs(item.fim) ?? start;
    const left = ((start - startBoundary) / totalRange) * 100;
    const width = (Math.max(end - start, 86_400_000) / totalRange) * 100;
    const safeLeft = Number.isFinite(left) ? Math.max(0, Math.min(100, left)) : 0;
    const safeWidth = Number.isFinite(width) ? Math.max(3, width) : 3;
    return {
      id: item.id,
      nome: item.nome,
      obraNome: item.obraNome,
      status: item.status,
      inicio: item.inicio,
      fim: item.fim,
      left: safeLeft,
      width: Math.min(100 - safeLeft, safeWidth),
      color: ganttBarColor(item.status),
    };
  });

  const okLabel: Record<string, string> = {
    tarefa_criada: "Tarefa criada com sucesso.",
    tarefa_atualizada: "Tarefa atualizada com sucesso.",
    tarefa_excluida: "Tarefa excluída com sucesso.",
    dependencia_criada: "Dependência criada com sucesso.",
    baseline_gerada: "Baseline gerada com sucesso.",
    replanejamento_registrado: "Replanejamento registrado com sucesso.",
  };

  const tabLink = (tab: string) => `/cronograma?obra_id=${encodeURIComponent(selectedObraId)}&status=${encodeURIComponent(selectedStatus)}&date_from=${encodeURIComponent(selectedDateFrom)}&date_to=${encodeURIComponent(selectedDateTo)}&view=${encodeURIComponent(tab)}&page=1`;

  return (
    <section className="of-page of-cronograma-page">
      <PageHeader
        eyebrow="Planejamento"
        title="Cronograma"
        subtitle="Visualize timeline, operacionalize tarefas e mantenha governança de prazo em um único fluxo."
        actions={
          <>
            <Link className="of-btn-ghost" href="/obras">Ver obras</Link>
            <Link className="of-btn-primary" href={tabLink("visao")}>Abrir visão Gantt</Link>
          </>
        }
      />

      {ok ? (
        <article className="of-card" style={{ borderColor: "var(--of-green)", background: "rgba(31, 208, 122, 0.09)" }}>
          <div className="of-card-title">Ação concluída</div>
          <p className="of-empty-text">{okLabel[ok] ?? "Operação concluída."}</p>
        </article>
      ) : null}

      <article className="of-card of-crono-tabs">
        <div className="of-card-title">Modo de trabalho</div>
        <nav className="of-page-head-actions of-crono-tabs-row" style={{ gap: 10 }} aria-label="Alternar modo do cronograma">
          <a href={tabLink("visao")} aria-current={selectedView === "visao" ? "page" : undefined} className={selectedView === "visao" ? "of-btn-primary" : "of-btn-ghost"}>Visão Gantt</a>
          <a href={tabLink("operacao")} aria-current={selectedView === "operacao" ? "page" : undefined} className={selectedView === "operacao" ? "of-btn-primary" : "of-btn-ghost"}>Operação</a>
          <a href={tabLink("governanca")} aria-current={selectedView === "governanca" ? "page" : undefined} className={selectedView === "governanca" ? "of-btn-primary" : "of-btn-ghost"}>Governança</a>
        </nav>
      </article>

      <article className="of-card of-crono-filter-card">
        <div className="of-card-title">Filtros</div>
        <form action="/cronograma" className="of-form-grid md:grid-cols-6 of-crono-filter-form" style={{ marginTop: 12 }}>
          <select name="obra_id" className="of-input" defaultValue={selectedObraId}>
            <option value="">Todas as obras</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>{obra.nome}</option>
            ))}
          </select>
          <select name="status" className="of-input" defaultValue={selectedStatus}>
            <option value="">Todos os status</option>
            <option value="planejado">Planejado</option>
            <option value="andamento">Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="atrasado">Atrasado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <input name="date_from" type="date" className="of-input" aria-label="Data inicial" defaultValue={selectedDateFrom} />
          <input name="date_to" type="date" className="of-input" aria-label="Data final" defaultValue={selectedDateTo} />
          <input type="hidden" name="view" value={selectedView} />
          <button type="submit" className="of-btn-primary">Aplicar</button>
        </form>
      </article>

      <div className="of-stats-grid">
        <article className="of-stat-card"><div className="of-stat-value">{totalTarefas}</div><div className="of-stat-label">Total de tarefas</div></article>
        <article className="of-stat-card"><div className="of-stat-value">{percentualConclusao}%</div><div className="of-stat-label">Conclusão</div></article>
        <article className="of-stat-card"><div className="of-stat-value">{vencendo7dias}</div><div className="of-stat-label">Vencendo em 7 dias</div></article>
        <article className="of-stat-card"><div className="of-stat-value">{tarefasAtrasadas}</div><div className="of-stat-label">Atrasadas</div></article>
      </div>
      <div className="of-stats-grid">
        <article className="of-stat-card"><div className="of-stat-value">{tarefasConcluidas}</div><div className="of-stat-label">Concluídas</div></article>
        <article className="of-stat-card"><div className="of-stat-value">{tarefasAndamento}</div><div className="of-stat-label">Em andamento</div></article>
        <article className="of-stat-card"><div className="of-stat-value">{atrasoMedioDias}</div><div className="of-stat-label">Atraso médio (dias)</div></article>
        <article className="of-stat-card"><div className="of-stat-value">{filteredDependencias.length}</div><div className="of-stat-label">Dependências ativas</div></article>
      </div>

      {selectedView === "visao" ? (
        <>
          {invalidTimelineCount > 0 ? (
            <article className="of-card" style={{ borderColor: "var(--of-yellow)", background: "rgba(245, 158, 11, 0.08)" }}>
              <div className="of-card-title">Atenção no cronograma</div>
              <p className="of-empty-text">
                {invalidTimelineCount} tarefa(s) ficaram fora do Gantt por data inválida. Revise início/fim na aba Operação.
              </p>
            </article>
          ) : null}
          <div className="of-gantt-controls of-crono-gantt-head">
            <span className="of-gantt-period">Timeline {months[0]} — {months[months.length - 1]} {new Date().getFullYear()}</span>
            <div className="of-gantt-legend">
              <span><i className="of-dot done" /> Concluído</span>
              <span><i className="of-dot active" /> Em andamento</span>
              <span><i className="of-dot warning" /> Atenção</span>
              <span><i className="of-dot planned" /> Planejado</span>
            </div>
          </div>
          <GanttView items={ganttItems} months={months} currentMonthIndex={monthIndex} />

          <article className="of-card of-crono-baseline-card">
            <div className="of-card-title">Baseline vs Atual</div>
            <div className="of-table-wrap" style={{ border: 0 }}>
              <table className="of-table">
                <thead>
                  <tr><th>Obra</th><th>Tarefa</th><th>Baseline</th><th>Atual</th><th>Desvio</th><th>Versão</th></tr>
                </thead>
                <tbody>
                  {baselineComparativo.slice(0, 20).map((item) => (
                    <tr key={item.id}>
                      <td>{item.obraNome}</td>
                      <td>{item.nome}</td>
                      <td className="of-mono">{item.baselineVersao ? "Registrada" : "—"}</td>
                      <td className="of-mono">{item.inicio} → {item.fim}</td>
                      <td>
                        {item.desvioDias === null ? "—" : (
                          <span className={`of-badge ${item.desvioDias > 0 ? "of-badge-error" : item.desvioDias < 0 ? "of-badge-success" : "of-badge-default"}`}>
                            {item.desvioDias > 0 ? `+${item.desvioDias}` : item.desvioDias} dias
                          </span>
                        )}
                      </td>
                      <td className="of-mono">{item.baselineVersao ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}

      {selectedView === "operacao" ? (
        <>
          <div className="of-gantt-controls of-crono-create-card-wrap">
            <form action={createCronogramaAction} className="of-card of-form-grid md:grid-cols-5" style={{ flex: 1 }}>
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="of-card-title md:col-span-5">Nova tarefa</div>
              <select name="obra_id" required className="of-input" defaultValue={selectedObraId || ""}>
                <option value="" disabled>Selecione a obra</option>
                {obras.map((obra) => (<option key={obra.id} value={obra.id}>{obra.nome}</option>))}
              </select>
              <input name="nome" required placeholder="Nome da tarefa" className="of-input" />
              <input name="inicio" required type="date" className="of-input" />
              <input name="fim" required type="date" className="of-input" />
              <select name="status" className="of-input" defaultValue="planejado">
                <option value="planejado">Planejado</option><option value="andamento">Andamento</option><option value="concluido">Concluído</option><option value="atrasado">Atrasado</option>
              </select>
              <div className="md:col-span-5"><button type="submit" className="of-btn-primary">Adicionar tarefa</button></div>
            </form>
          </div>

          <article className="of-card of-crono-edit-card">
            <div className="of-card-title">Tarefas (paginado)</div>
            <div className="of-crono-edit-list">
              {paginatedItems.map((item) => (
                <div className="of-crono-edit-item" key={item.id}>
                  <div className="of-crono-edit-head">
                    <p className="of-crono-edit-obra">{item.obraNome}</p>
                    <span className={`of-crono-status-badge ${cronogramaStatusTone(item.status)}`}>{cronogramaStatusLabel(item.status)}</span>
                  </div>
                  <form action={updateCronogramaAction} className="of-crono-edit-form">
                    <input type="hidden" name="return_to" value={returnTo} />
                    <input type="hidden" name="tarefa_id" value={item.id} />
                    <div className="of-crono-edit-grid">
                      <div className="of-crono-field"><label className="of-crono-field-label">Tarefa</label><input name="nome" defaultValue={item.nome} className="of-input" /></div>
                      <div className="of-crono-field"><label className="of-crono-field-label">Início</label><input name="inicio" type="date" defaultValue={item.inicio} className="of-input" /></div>
                      <div className="of-crono-field"><label className="of-crono-field-label">Fim</label><input name="fim" type="date" defaultValue={item.fim} className="of-input" /></div>
                      <div className="of-crono-field"><label className="of-crono-field-label">Status</label><select name="status" defaultValue={item.status} className="of-input"><option value="planejado">Planejado</option><option value="andamento">Andamento</option><option value="concluido">Concluído</option><option value="atrasado">Atrasado</option><option value="cancelado">Cancelado</option></select></div>
                    </div>
                    <div className="of-crono-edit-actions"><button type="submit" className="of-btn-primary">Salvar alterações</button><span className="of-mono">Atualizado: {item.updatedAt ? new Date(item.updatedAt).toLocaleString("pt-BR") : "—"}</span></div>
                  </form>
                  <form action={deleteCronogramaAction} className="of-crono-delete-form">
                    <input type="hidden" name="return_to" value={returnTo} />
                    <input type="hidden" name="tarefa_id" value={item.id} />
                    <label className="of-empty-text" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" name="confirm_delete" value="yes" required />
                      Confirmo exclusão
                    </label>
                    <button type="submit" className="of-btn-ghost">Excluir tarefa</button>
                  </form>
                </div>
              ))}
              {paginatedItems.length === 0 ? <p className="of-empty-text" style={{ margin: 0 }}>Nenhuma tarefa cadastrada.</p> : null}
            </div>
            <div className="of-page-head-actions" style={{ marginTop: 12 }}>
              <a className="of-btn-ghost" href={`/cronograma?obra_id=${encodeURIComponent(selectedObraId)}&status=${encodeURIComponent(selectedStatus)}&date_from=${encodeURIComponent(selectedDateFrom)}&date_to=${encodeURIComponent(selectedDateTo)}&view=${encodeURIComponent(selectedView)}&page=${prevPage}`}>Anterior</a>
              <span className="of-empty-text">Página {pageNum} de {totalPages}</span>
              <a className="of-btn-ghost" href={`/cronograma?obra_id=${encodeURIComponent(selectedObraId)}&status=${encodeURIComponent(selectedStatus)}&date_from=${encodeURIComponent(selectedDateFrom)}&date_to=${encodeURIComponent(selectedDateTo)}&view=${encodeURIComponent(selectedView)}&page=${nextPage}`}>Próxima</a>
            </div>
          </article>
        </>
      ) : null}

      {selectedView === "governanca" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2 of-crono-govern-grid">
            <form action={createDependenciaAction} className="of-card of-form-grid md:grid-cols-2">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="of-card-title md:col-span-2">Dependências</div>
              <select name="tarefa_predecessora_id" required defaultValue="" className="of-input"><option value="" disabled>Tarefa predecessora</option>{filteredItems.map((item) => (<option key={item.id} value={item.id}>{item.obraNome} · {item.nome}</option>))}</select>
              <select name="tarefa_sucessora_id" required defaultValue="" className="of-input"><option value="" disabled>Tarefa sucessora</option>{filteredItems.map((item) => (<option key={item.id} value={item.id}>{item.obraNome} · {item.nome}</option>))}</select>
              <select name="tipo" defaultValue="finish_to_start" className="of-input md:col-span-2"><option value="finish_to_start">Finish-to-start</option><option value="start_to_start">Start-to-start</option></select>
              <button type="submit" className="of-btn-primary md:col-span-2">Criar dependência</button>
            </form>

            <form action={gerarBaselineAction} className="of-card of-form-grid">
              <input type="hidden" name="return_to" value={returnTo} />
              <div className="of-card-title">Baseline</div>
              <select name="obra_id" required defaultValue={selectedObraId || ""} className="of-input"><option value="" disabled>Obra para baseline</option>{obras.map((obra) => (<option key={obra.id} value={obra.id}>{obra.nome}</option>))}</select>
              <button type="submit" className="of-btn-ghost">Gerar snapshot baseline</button>
              <p className="of-empty-text">Dependências registradas: <strong>{filteredDependencias.length}</strong></p>
            </form>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="of-card">
              <div className="of-card-title">Caminho crítico</div>
              <div className="of-table-wrap" style={{ border: 0 }}>
                <table className="of-table"><thead><tr><th>Obra</th><th>Tarefa</th><th>Duração</th><th>Dependências</th></tr></thead><tbody>
                  {filteredCaminhoCritico.map((item) => (
                    <tr key={item.tarefaId}><td>{item.obraNome}</td><td>{item.nome}</td><td className="of-mono">{item.duracaoDias} dias</td><td className="of-mono">{item.dependencias}</td></tr>
                  ))}
                  {filteredCaminhoCritico.length === 0 ? <tr><td colSpan={4} className="of-empty-text">Sem dados para caminho crítico.</td></tr> : null}
                </tbody></table>
              </div>
            </article>

            <article className="of-card">
              <div className="of-card-title">Replanejamento</div>
              <form action={createReplanejamentoAction} className="of-form-grid" style={{ marginBottom: 18 }}>
                <input type="hidden" name="return_to" value={returnTo} />
                <select name="obra_id" required className="of-input" defaultValue={selectedObraId || ""}><option value="" disabled>Obra impactada</option>{obras.map((obra) => (<option key={obra.id} value={obra.id}>{obra.nome}</option>))}</select>
                <input name="motivo" required className="of-input" placeholder="Motivo do replanejamento" />
                <div className="of-inline-grid-2"><input name="impacto_prazo_dias" type="number" min={0} defaultValue={0} className="of-input" placeholder="Impacto em dias" /><input name="impacto_custo" type="number" min={0} step="0.01" defaultValue={0} className="of-input" placeholder="Impacto financeiro" /></div>
                <button type="submit" className="of-btn-primary">Registrar replanejamento</button>
              </form>
              <div className="of-replan-header"><h4 className="of-replan-title">Histórico ({filteredReplanejamentos.length})</h4></div>
              {filteredReplanejamentos.length > 0 ? (
                <div className="of-replan-list">{filteredReplanejamentos.map((item) => (
                  <div className="of-replan-item" key={item.id}><div className="of-replan-head"><p className="of-replan-obra">{item.obraNome}</p><span className="of-replan-date">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span></div><p className="of-replan-motivo">{item.motivo}</p><div className="of-replan-impacts"><div className="of-replan-impact"><span className="of-replan-label">Impacto em prazo</span><span className="of-replan-value">{item.impactoPrazoDias} dias</span></div><div className="of-replan-impact"><span className="of-replan-label">Impacto financeiro</span><span className="of-replan-value">R$ {item.impactoCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div><div className="of-replan-impact"><span className="of-replan-label">Status</span><span className={`of-replan-status ${item.status}`}>{item.status}</span></div></div></div>
                ))}</div>
              ) : <p className="of-empty-text" style={{ margin: 0, padding: "12px 0" }}>Nenhum replanejamento registrado.</p>}
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
