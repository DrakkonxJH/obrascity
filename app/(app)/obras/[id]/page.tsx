import Link from "next/link";
import { notFound } from "next/navigation";
import { listObras } from "@/lib/db/obras";
import { listFinanceiro } from "@/lib/db/financeiro";
import { listDiarios } from "@/lib/db/diario";
import { listCronograma } from "@/lib/db/cronograma";
import { listPedidosCompra } from "@/lib/db/materiais";
import { listRelatorios } from "@/lib/db/relatorios";
import { listNotificacoes } from "@/lib/db/notificacoes";
import { ObraLifecycleActions } from "@/components/obras/obra-lifecycle-actions";

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

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function taskBadge(status: string) {
  const value = normalize(status);
  if (value.includes("concl")) return "of-badge of-badge-green";
  if (value.includes("aprov")) return "of-badge of-badge-green";
  if (value.includes("rejeit")) return "of-badge of-badge-red";
  if (value.includes("aguard")) return "of-badge of-badge-yellow";
  if (value.includes("trans")) return "of-badge of-badge-blue";
  if (value.includes("aten") || value.includes("atras")) return "of-badge of-badge-yellow";
  if (value.includes("andam") || value.includes("progress")) return "of-badge of-badge-blue";
  return "of-badge";
}

function taskLabel(status: string) {
  const value = normalize(status);
  if (value.includes("concl")) return "Concluída";
  if (value.includes("aprov")) return "Aprovado";
  if (value.includes("rejeit")) return "Rejeitado";
  if (value.includes("aguard")) return "Aguardando";
  if (value.includes("trans")) return "Em trânsito";
  if (value.includes("aten") || value.includes("atras")) return "Atenção";
  if (value.includes("andam") || value.includes("progress")) return "Em andamento";
  return "Planejada";
}

function resolveTaskMaterials(taskName: string, pedidos: { material_nome: string; quantidade: number; valor: number }[]) {
  const taskWords = normalize(taskName)
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const matches = pedidos.filter((pedido) =>
    taskWords.some((word) => normalize(pedido.material_nome).includes(word)),
  );
  const source = matches.length > 0 ? matches : pedidos;
  return source.slice(0, 2).map((pedido) => ({
    nome: pedido.material_nome,
    quantidade: pedido.quantidade,
    valor: pedido.valor,
  }));
}

export default async function ObraDetailPage({ params }: ObraDetailPageProps) {
  const { id } = await params;
  const [obras, financeiro, diarios, cronograma, pedidos, relatórios, notificacoes] = await Promise.all([
    listObras(),
    listFinanceiro(),
    listDiarios(),
    listCronograma(),
    listPedidosCompra(),
    listRelatorios(),
    listNotificacoes(20),
  ]);
  const obra = obras.find((item) => item.id === id);

  if (!obra) notFound();

  const financeiroObra = financeiro.filter((item) => item.obra_id === obra.id);
  const diariosObra = diarios.filter((item) => item.obra_id === obra.id).slice(0, 12);
  const cronogramaObra = cronograma.filter((item) => item.obra_id === obra.id);
  const pedidosObra = pedidos.filter((item) => item.obra_nome === obra.nome).slice(0, 12);
  const relatóriosObra = relatórios.filter((item) => item.obra_nome === obra.nome).slice(0, 8);
  const notificacoesObra = notificacoes
    .filter(
      (item) =>
        item.link?.includes(`/obras/${obra.id}`) ||
        normalize(item.titulo).includes(normalize(obra.nome)),
    )
    .slice(0, 8);
  const orcadoTotal = financeiroObra.reduce((sum, item) => sum + item.orcado, 0);
  const realizadoTotal = financeiroObra.reduce((sum, item) => sum + item.realizado, 0);
  const consumo = orcadoTotal > 0 ? Math.round((realizadoTotal / orcadoTotal) * 100) : 0;
  const saldo = orcadoTotal - realizadoTotal;
  const totalPedidos = pedidosObra.reduce((sum, item) => sum + item.valor, 0);

  const tarefasConcluidas = cronogramaObra.filter((item) => normalize(item.status).includes("concl")).length;
  const progressoCronograma =
    cronogramaObra.length > 0 ? Math.round((tarefasConcluidas / cronogramaObra.length) * 100) : 0;
  const efetivoMedio =
    diariosObra.length > 0
      ? Math.round(diariosObra.reduce((sum, item) => sum + item.efetivo, 0) / diariosObra.length)
      : 0;
  const atividadesExecutar = cronogramaObra.map((tarefa, index) => {
    const categoria = financeiroObra[index % Math.max(1, financeiroObra.length)];
    const materiaisRelacionados = resolveTaskMaterials(tarefa.nome, pedidosObra);
    return {
      id: tarefa.id,
      atividade: tarefa.nome,
      parteObra: categoria?.categoria ?? "Frente geral da obra",
      custoPrevisto: categoria?.orcado ?? 0,
      materiais: materiaisRelacionados,
      executor: "Equipe técnica da obra",
      status: taskLabel(tarefa.status),
    };
  });

  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 8 }}>
            {obra.nome}
          </h1>
          <p className="of-empty-text">Cliente: {obra.cliente}</p>
        </div>
        <span className={statusBadge(obra.status)}>{statusLabel(obra.status)}</span>
      </div>

      <div style={{ marginBottom: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/cronograma" className="of-btn-primary">
          Cronograma
        </Link>
        <Link href="/financeiro" className="of-btn-ghost">
          Financeiro
        </Link>
        <Link href="/diario" className="of-btn-ghost">
          Diário
        </Link>
        <Link href="/materiais" className="of-btn-ghost">
          Materiais e compras
        </Link>
        <Link href="/relatorios" className="of-btn-ghost">
          Relatórios
        </Link>
      </div>

      <div style={{ marginBottom: 18 }}>
        <ObraLifecycleActions obra={obra} afterActionHref="/obras" />
      </div>

      <div
        className="of-dashboard-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginBottom: 18 }}
      >
        <article className="of-card">
          <div className="of-card-title">Progresso da obra</div>
          <p className="of-kpi-value">{obra.progresso}%</p>
          <div className="of-bar-track">
            <div className="of-bar-fill" style={{ width: `${obra.progresso}%` }} />
          </div>
        </article>
        <article className="of-card">
          <div className="of-card-title">Orçado total</div>
          <p className="of-kpi-value">{money.format(orcadoTotal)}</p>
          <p className="of-empty-text">Categorias financeiras consolidadas</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Realizado total</div>
          <p className="of-kpi-value">{money.format(realizadoTotal)}</p>
          <p className="of-empty-text">Consumo do orçamento: {consumo}%</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Saldo disponível</div>
          <p className="of-kpi-value">{money.format(saldo)}</p>
          <p className="of-empty-text">{saldo < 0 ? "Acima do orçado" : "Dentro do orçamento"}</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Cronograma concluído</div>
          <p className="of-kpi-value">{progressoCronograma}%</p>
          <p className="of-empty-text">
            {tarefasConcluidas}/{cronogramaObra.length} tarefas concluídas
          </p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Efetivo médio</div>
          <p className="of-kpi-value">{efetivoMedio}</p>
          <p className="of-empty-text">Média dos últimos diários</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Pedidos de compra</div>
          <p className="of-kpi-value">{pedidosObra.length}</p>
          <p className="of-empty-text">Total solicitado: {money.format(totalPedidos)}</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Relatórios da obra</div>
          <p className="of-kpi-value">{relatóriosObra.length}</p>
          <p className="of-empty-text">Histórico de relatórios emitidos</p>
        </article>
      </div>

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 18 }}>
        <article className="of-card">
          <div className="of-card-title">Atividades a executar</div>
          {atividadesExecutar.length === 0 ? (
            <p className="of-empty-text">Sem tarefas cadastradas para montar o plano executivo da obra.</p>
          ) : (
            <div className="of-table-wrap" style={{ border: 0, overflowX: "auto" }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Atividade</th>
                    <th>Parte da obra</th>
                    <th>Custo previsto</th>
                    <th>Materiais e quantidade</th>
                    <th>Executor</th>
                    <th>Orçamento disponível</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesExecutar.map((atividade) => (
                    <tr key={atividade.id}>
                      <td>{atividade.atividade}</td>
                      <td>{atividade.parteObra}</td>
                      <td>{money.format(atividade.custoPrevisto)}</td>
                      <td>
                        {atividade.materiais.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {atividade.materiais.map((material) => (
                              <li key={`${atividade.id}-${material.nome}`} style={{ marginBottom: 3 }}>
                                {material.nome} · {material.quantidade} un · {money.format(material.valor)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "Definir lista de materiais"
                        )}
                      </td>
                      <td>{atividade.executor}</td>
                      <td>{money.format(Math.max(0, saldo))}</td>
                      <td>
                        <span className={taskBadge(atividade.status)}>{atividade.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <article className="of-card" style={{ marginBottom: 18 }}>
        <div className="of-card-title">Cronograma da obra</div>
        {cronogramaObra.length === 0 ? (
          <p className="of-empty-text">Sem tarefas cadastradas para esta obra.</p>
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

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 18 }}>
        <article className="of-card">
          <div className="of-card-title">Diário de obra (histórico)</div>
          {diariosObra.length === 0 ? (
            <p className="of-empty-text">Sem registros no diário para esta obra.</p>
          ) : (
            <ul className="of-list">
              {diariosObra.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">
                    {new Date(item.data_ref).toLocaleDateString("pt-BR")} · Efetivo {item.efetivo}
                  </p>
                  <p className="of-list-description">
                    {item.clima ? `Clima: ${item.clima} · ` : ""}
                    {item.ocorrencias || "Sem ocorrências registradas"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="of-card">
          <div className="of-card-title">Compras e suprimentos da obra</div>
          {pedidosObra.length === 0 ? (
            <p className="of-empty-text">Sem pedidos de compra vinculados a esta obra.</p>
          ) : (
            <div className="of-table-wrap" style={{ border: 0 }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Fornecedor</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosObra.map((item) => (
                    <tr key={item.id}>
                      <td>{item.material_nome}</td>
                      <td>{item.fornecedor || "—"}</td>
                      <td>
                        <span className={taskBadge(item.status)}>{taskLabel(item.status)}</span>
                      </td>
                      <td>{money.format(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <div className="of-dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <article className="of-card">
          <div className="of-card-title">Relatórios da obra</div>
          {relatóriosObra.length === 0 ? (
            <p className="of-empty-text">Sem relatórios gerados especificamente para esta obra.</p>
          ) : (
            <ul className="of-list">
              {relatóriosObra.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">
                    {item.tipo} · {item.formato.toUpperCase()}
                  </p>
                  <p className="of-list-description">
                    Status: {item.status} · {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="of-card">
          <div className="of-card-title">Alertas e notificações relacionadas</div>
          {notificacoesObra.length === 0 ? (
            <p className="of-empty-text">Sem notificações específicas para esta obra.</p>
          ) : (
            <ul className="of-list">
              {notificacoesObra.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">{item.titulo}</p>
                  <p className="of-list-description">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {item.lida ? "Lida" : "Não lida"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/obras" className="of-btn-ghost">
          Voltar para obras
        </Link>
        <Link href="/cronograma" className="of-btn-primary">
          Ver cronograma
        </Link>
      </div>
    </section>
  );
}
