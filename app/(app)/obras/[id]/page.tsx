import Link from "next/link";
import { notFound } from "next/navigation";
import { listObras } from "@/lib/db/obras";
import { listFinanceiro } from "@/lib/db/financeiro";
import { listDiarios } from "@/lib/db/diario";
import { listCronograma } from "@/lib/db/cronograma";
import { listPedidosCompra } from "@/lib/db/materiais";
import { listRelatorios } from "@/lib/db/relatorios";
import { ObraLifecycleActions } from "@/components/organisms/obra-lifecycle-actions";
import { PageHeader } from "@/components/molecules/page-header";

type ObraDetailPageProps = {
  params: Promise<{ id: string }>;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusLabel(status: string) {
  if (status === "concluida") return "Concluída";
  if (status === "atencao") return "Atenção";
  if (status === "andamento") return "Em andamento";
  return "Planejamento";
}

function statusBadge(status: string) {
  if (status === "concluida") return "of-badge of-badge-green";
  if (status === "atencao") return "of-badge of-badge-yellow";
  if (status === "andamento") return "of-badge of-badge-blue";
  return "of-badge";
}

function taskBadge(status: string) {
  const value = status.trim().toLowerCase();
  if (value.includes("concl")) return "of-badge of-badge-green";
  if (value.includes("aten") || value.includes("atras")) return "of-badge of-badge-yellow";
  if (value.includes("andam") || value.includes("progress")) return "of-badge of-badge-blue";
  return "of-badge";
}

function taskLabel(status: string) {
  const value = status.trim().toLowerCase();
  if (value.includes("concl")) return "Concluída";
  if (value.includes("aten") || value.includes("atras")) return "Atenção";
  if (value.includes("andam") || value.includes("progress")) return "Em andamento";
  return "Planejada";
}

function isCompletedTask(status: string) {
  return status.trim().toLowerCase().includes("concl");
}

export default async function ObraDetailPage({ params }: ObraDetailPageProps) {
  const { id } = await params;
  const [obras, financeiro, diarios, cronograma, pedidos, relatorios] = await Promise.all([
    listObras(),
    listFinanceiro(),
    listDiarios(),
    listCronograma(),
    listPedidosCompra(),
    listRelatorios(),
  ]);
  const obra = obras.find((item) => item.id === id);

  if (!obra) notFound();

  const financeiroObra = financeiro.filter((item) => item.obra_id === obra.id);
  const diariosObra = diarios.filter((item) => item.obra_id === obra.id).slice(0, 8);
  const cronogramaObra = cronograma.filter((item) => item.obra_id === obra.id);
  const pedidosObra = pedidos.filter((item) => item.obra_id === obra.id).slice(0, 8);
  const relatoriosObra = relatorios.filter((item) => item.obra_id === obra.id).slice(0, 8);

  const orcadoTotal = financeiroObra.reduce((sum, item) => sum + item.orcado, 0);
  const realizadoTotal = financeiroObra.reduce((sum, item) => sum + item.realizado, 0);
  const saldo = orcadoTotal - realizadoTotal;
  const tarefasConcluidas = cronogramaObra.filter((item) => isCompletedTask(item.status)).length;
  const progressoCronograma =
    cronogramaObra.length > 0 ? Math.round((tarefasConcluidas / cronogramaObra.length) * 100) : 0;
  const atividadesRealizadas = cronogramaObra
    .filter((item) => isCompletedTask(item.status))
    .sort((a, b) => new Date(b.fim).getTime() - new Date(a.fim).getTime());
  const atividadesExecutar = cronogramaObra
    .filter((item) => !isCompletedTask(item.status))
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const historicoExecucao = diariosObra.sort(
    (a, b) => new Date(b.data_ref).getTime() - new Date(a.data_ref).getTime(),
  );

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Cockpit da obra"
        title={obra.nome}
        subtitle={`Cliente: ${obra.cliente}`}
        actions={<span className={statusBadge(obra.status)}>{statusLabel(obra.status)}</span>}
      />

      <div style={{ marginBottom: 16 }}>
        <ObraLifecycleActions obra={obra} afterActionHref="/obras" />
      </div>

      <div
        className="of-dashboard-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginBottom: 16 }}
      >
        <article className="of-kpi-card">
          <div className="of-kpi-label">Progresso da obra</div>
          <div className="of-kpi-value">{obra.progresso}%</div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Orçado total</div>
          <div className="of-kpi-value">{money.format(orcadoTotal)}</div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Realizado total</div>
          <div className="of-kpi-value">{money.format(realizadoTotal)}</div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Saldo disponível</div>
          <div className="of-kpi-value">{money.format(saldo)}</div>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Cronograma concluído</div>
          <div className="of-kpi-value">{progressoCronograma}%</div>
          <p className="of-empty-text">
            {tarefasConcluidas}/{cronogramaObra.length} tarefas concluídas
          </p>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Atividades realizadas</div>
          <div className="of-kpi-value">{atividadesRealizadas.length}</div>
          <p className="of-empty-text">Concluídas no cronograma</p>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Atividades a executar</div>
          <div className="of-kpi-value">{atividadesExecutar.length}</div>
          <p className="of-empty-text">Pendentes e em andamento</p>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Histórico operacional</div>
          <div className="of-kpi-value">{historicoExecucao.length}</div>
          <p className="of-empty-text">Registros no diário de obra</p>
        </article>
      </div>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Cronograma da obra</div>
        {cronogramaObra.length === 0 ? (
          <p className="of-empty-text">Sem tarefas cadastradas.</p>
        ) : (
          <div className="of-table-wrap" style={{ border: 0, overflowX: "auto" }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cronogramaObra.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{new Date(item.inicio).toLocaleDateString("pt-BR")}</td>
                    <td>{new Date(item.fim).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <span className={taskBadge(item.status)}>{taskLabel(item.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        <article className="of-card">
          <div className="of-card-title">Atividades realizadas</div>
          {atividadesRealizadas.length === 0 ? (
            <p className="of-empty-text">Ainda não há atividades concluídas.</p>
          ) : (
            <div className="of-table-wrap" style={{ border: 0, overflowX: "auto" }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Atividade</th>
                    <th>Concluída em</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesRealizadas.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nome}</td>
                      <td>{new Date(item.fim).toLocaleDateString("pt-BR")}</td>
                      <td>
                        <span className={taskBadge(item.status)}>{taskLabel(item.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="of-card">
          <div className="of-card-title">Atividades que serão executadas</div>
          {atividadesExecutar.length === 0 ? (
            <p className="of-empty-text">Não há atividades pendentes no cronograma.</p>
          ) : (
            <div className="of-table-wrap" style={{ border: 0, overflowX: "auto" }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Atividade</th>
                    <th>Início previsto</th>
                    <th>Término previsto</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesExecutar.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nome}</td>
                      <td>{new Date(item.inicio).toLocaleDateString("pt-BR")}</td>
                      <td>{new Date(item.fim).toLocaleDateString("pt-BR")}</td>
                      <td>
                        <span className={taskBadge(item.status)}>{taskLabel(item.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Histórico de execução (quem executou o quê)</div>
        {historicoExecucao.length === 0 ? (
          <p className="of-empty-text">Sem histórico operacional no diário da obra.</p>
        ) : (
          <div className="of-table-wrap" style={{ border: 0, overflowX: "auto" }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Atividade executada</th>
                  <th>Responsável pelo registro</th>
                  <th>Efetivo</th>
                  <th>Equipamentos</th>
                </tr>
              </thead>
              <tbody>
                {historicoExecucao.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.data_ref).toLocaleDateString("pt-BR")}</td>
                    <td>{item.ocorrencias || "Sem descrição informada"}</td>
                    <td>{item.created_by_nome || "Não informado"}</td>
                    <td>{item.efetivo}</td>
                    <td>{item.equipamentos || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        <article className="of-card">
          <div className="of-card-title">Diário de obra</div>
          {diariosObra.length === 0 ? (
            <p className="of-empty-text">Sem registros no diário.</p>
          ) : (
            <ul className="of-list">
              {diariosObra.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">
                    {new Date(item.data_ref).toLocaleDateString("pt-BR")} · Efetivo {item.efetivo}
                  </p>
                  <p className="of-list-description">
                    {item.ocorrencias || "Sem ocorrências registradas"} · Responsável:{" "}
                    {item.created_by_nome || "Não informado"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="of-card">
          <div className="of-card-title">Compras da obra</div>
          {pedidosObra.length === 0 ? (
            <p className="of-empty-text">Sem pedidos de compra vinculados.</p>
          ) : (
            <ul className="of-list">
              {pedidosObra.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">{item.material_nome}</p>
                  <p className="of-list-description">
                    {item.fornecedor || "Sem fornecedor"} · {money.format(item.valor)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Histórico financeiro essencial da obra</div>
        {financeiroObra.length === 0 ? (
          <p className="of-empty-text">Sem lançamentos financeiros cadastrados.</p>
        ) : (
          <div className="of-table-wrap" style={{ border: 0, overflowX: "auto" }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Orçado</th>
                  <th>Realizado</th>
                  <th>Saldo da categoria</th>
                </tr>
              </thead>
              <tbody>
                {financeiroObra.map((item) => (
                  <tr key={item.id}>
                    <td>{item.categoria}</td>
                    <td>{money.format(item.orcado)}</td>
                    <td>{money.format(item.realizado)}</td>
                    <td>{money.format(item.orcado - item.realizado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="of-card">
        <div className="of-card-title">Relatórios da obra</div>
        {relatoriosObra.length === 0 ? (
          <p className="of-empty-text">Sem relatórios gerados para esta obra.</p>
        ) : (
          <ul className="of-list">
            {relatoriosObra.map((item) => (
              <li key={item.id} className="of-list-item">
                <p className="of-list-title">
                  {item.tipo} · {item.formato.toUpperCase()}
                </p>
                <p className="of-list-description">Status: {item.status}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <div style={{ marginTop: 16 }}>
        <Link href="/obras" className="of-btn-ghost">
          Voltar para obras
        </Link>
      </div>
    </section>
  );
}
