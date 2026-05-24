import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { listObras } from "@/lib/db/obras";
import { listFinanceiro } from "@/lib/db/financeiro";
import { listEquipes, listMembros } from "@/lib/db/equipes";
import { listMateriais, listPedidosCompra } from "@/lib/db/materiais";
import { listDiarios } from "@/lib/db/diario";
import { getDashboardResumo } from "@/lib/db/obras";
import { listRelatorios } from "@/lib/db/relatorios";
import { solicitarRelatórioAction } from "../actions";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";

type ReportType = "progresso" | "financeiro" | "equipes" | "materiais" | "diario" | "executivo";

type PageParams = { params: { tipo: string } };

const reportMeta: Record<
  ReportType,
  {
    title: string;
    subtitle: string;
    formats: Array<"pdf" | "excel">;
  }
> = {
  progresso: { title: "Relatório de Progresso", subtitle: "Painel consolidado do avanço das obras.", formats: ["pdf", "excel"] },
  financeiro: { title: "Relatório Financeiro", subtitle: "Resumo orçamentário, realizado e previsões.", formats: ["pdf", "excel"] },
  equipes: { title: "Relatório de Equipes", subtitle: "Alocação, produtividade e cobertura de profissionais.", formats: ["pdf"] },
  materiais: { title: "Relatório de Materiais", subtitle: "Estoque, consumo e pedidos pendentes.", formats: ["pdf", "excel"] },
  diario: { title: "Diário de Obra", subtitle: "Registro operacional diário por obra.", formats: ["pdf"] },
  executivo: { title: "Sumário Executivo", subtitle: "Visão diretiva com KPIs e riscos críticos.", formats: ["pdf"] },
};

function isReportType(value: string): value is ReportType {
  return value in reportMeta;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ReportTypePage({ params }: PageParams) {
  const { tipo } = params;
  if (!isReportType(tipo)) notFound();

  const meta = reportMeta[tipo];
  const relatórios = await listRelatorios();
  const latestRelatórios = relatórios.filter((rel) => rel.tipo === tipo).slice(0, 5);

  const exportForm = (formato: "pdf" | "excel") => (
    <form action={solicitarRelatórioAction}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="formato" value={formato} />
      <button type="submit" className="of-btn-primary">
        Exportar {formato.toUpperCase()}
      </button>
    </form>
  );

  let mainSection: ReactNode = null;
  let detailSection: ReactNode = null;

  if (tipo === "progresso" || tipo === "executivo") {
    const resumo = await getDashboardResumo();
    const obrasDetalhadas = await listObras();
    mainSection = (
      <div className="of-kpi-grid">
        <article className="of-metric-card blue">
          <p className="of-kpi-label">Obras</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>
            {resumo.total}
          </p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-label">Em andamento</p>
          <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>
            {resumo.andamento}
          </p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">Concluídas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>
            {resumo.concluidas}
          </p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-label">Alertas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>
            {Math.max(0, resumo.total - resumo.concluidas - resumo.andamento)}
          </p>
        </article>
      </div>
    );
    detailSection = (
      <div className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Obras monitoradas</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {obrasDetalhadas.map((obra) => (
                <tr key={obra.id}>
                  <td>{obra.nome}</td>
                  <td>{obra.cliente}</td>
                  <td>{obra.status}</td>
                  <td>{obra.progresso}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tipo === "financeiro") {
    const financeiro = await listFinanceiro();
    const totalOrcado = financeiro.reduce((acc, item) => acc + item.orcado, 0);
    const totalRealizado = financeiro.reduce((acc, item) => acc + item.realizado, 0);
    const porObra = financeiro.reduce<Record<string, { orcado: number; realizado: number }>>((acc, item) => {
      const current = acc[item.obra_nome] ?? { orcado: 0, realizado: 0 };
      current.orcado += item.orcado;
      current.realizado += item.realizado;
      acc[item.obra_nome] = current;
      return acc;
    }, {});
    mainSection = (
      <div className="of-card">
        <div className="of-card-title">Resumo Financeiro</div>
        <div className="of-kpi-grid">
          <article className="of-metric-card blue">
            <p className="of-kpi-label">Orçado</p>
            <p className="of-kpi-value">{formatMoney(totalOrcado)}</p>
          </article>
          <article className="of-metric-card yellow">
            <p className="of-kpi-label">Realizado</p>
            <p className="of-kpi-value">{formatMoney(totalRealizado)}</p>
          </article>
          <article className="of-metric-card green">
            <p className="of-kpi-label">Saldo</p>
            <p className="of-kpi-value">{formatMoney(totalOrcado - totalRealizado)}</p>
          </article>
        </div>
      </div>
    );
    detailSection = (
      <div className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Lançamentos por obra</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Orçado</th>
                <th>Realizado</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(porObra).map(([obra, values]) => (
                <tr key={obra}>
                  <td>{obra}</td>
                  <td>{formatMoney(values.orcado)}</td>
                  <td>{formatMoney(values.realizado)}</td>
                  <td>{formatMoney(values.orcado - values.realizado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tipo === "equipes") {
    const [equipes, membros] = await Promise.all([listEquipes(), listMembros()]);
    mainSection = (
      <div className="of-card">
        <div className="of-card-title">Resumo de Equipes</div>
        <div className="of-kpi-grid">
          <article className="of-metric-card blue">
            <p className="of-kpi-label">Equipes</p>
            <p className="of-kpi-value">{equipes.length}</p>
          </article>
          <article className="of-metric-card yellow">
            <p className="of-kpi-label">Membros</p>
            <p className="of-kpi-value">{membros.length}</p>
          </article>
        </div>
      </div>
    );
    detailSection = (
      <div className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Equipes e membros</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Equipe</th>
                <th>Especialidade</th>
                <th>Qtde. membros</th>
              </tr>
            </thead>
            <tbody>
              {equipes.map((equipe) => (
                <tr key={equipe.id}>
                  <td>{equipe.nome}</td>
                  <td>{equipe.especialidade ?? "—"}</td>
                  <td>{membros.filter((membro) => membro.equipe_id === equipe.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tipo === "materiais") {
    const [materiais, pedidos] = await Promise.all([listMateriais(), listPedidosCompra()]);
    const criticos = materiais.filter((material) => material.quantidade <= material.mínimo).length;
    const pendentes = pedidos.filter((pedido) => pedido.status === "pendente").length;
    mainSection = (
      <div className="of-card">
        <div className="of-card-title">Resumo de Materiais</div>
        <div className="of-kpi-grid">
          <article className="of-metric-card blue">
            <p className="of-kpi-label">Itens cadastrados</p>
            <p className="of-kpi-value">{materiais.length}</p>
          </article>
          <article className="of-metric-card yellow">
            <p className="of-kpi-label">Críticos</p>
            <p className="of-kpi-value">{criticos}</p>
          </article>
          <article className="of-metric-card green">
            <p className="of-kpi-label">Pedidos pendentes</p>
            <p className="of-kpi-value">{pendentes}</p>
          </article>
        </div>
      </div>
    );
    detailSection = (
      <>
        <div className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Materiais críticos</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Estoque</th>
                  <th>Mínimo</th>
                  <th>Unidade</th>
                </tr>
              </thead>
              <tbody>
                {materiais
                  .filter((material) => material.quantidade <= material.mínimo)
                  .map((material) => (
                    <tr key={material.id}>
                      <td>{material.nome}</td>
                      <td>{material.quantidade}</td>
                      <td>{material.mínimo}</td>
                      <td>{material.unidade}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Pedidos recentes</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Obra</th>
                  <th>Fornecedor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>{pedido.material_nome}</td>
                    <td>{pedido.obra_nome}</td>
                    <td>{pedido.fornecedor || "—"}</td>
                    <td>{pedido.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  if (tipo === "diario") {
    const diarios = await listDiarios();
    mainSection = (
      <div className="of-card">
        <div className="of-card-title">Resumo do Diário</div>
        <div className="of-kpi-grid">
          <article className="of-metric-card blue">
            <p className="of-kpi-label">Registros</p>
            <p className="of-kpi-value">{diarios.length}</p>
          </article>
          <article className="of-metric-card yellow">
            <p className="of-kpi-label">Último registro</p>
            <p className="of-kpi-value">{diarios[0]?.data_ref ?? "—"}</p>
          </article>
        </div>
      </div>
    );
    detailSection = (
      <div className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Últimos registros</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Obra</th>
                <th>Clima</th>
                <th>Efetivo</th>
              </tr>
            </thead>
            <tbody>
              {diarios.map((diario) => (
                <tr key={diario.id}>
                  <td>{diario.data_ref}</td>
                  <td>{diario.obra_nome}</td>
                  <td>{diario.clima ?? "—"}</td>
                  <td>{diario.efetivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <FeatureGateWrapper feature="relatórios_basic">
      <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="of-empty-text" style={{ marginBottom: 6 }}>
            {meta.subtitle}
          </p>
          <h1 className="of-card-title">{meta.title}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {meta.formats.map((formato) => exportForm(formato))}
          <Link href="/relatorios" className="of-btn-ghost">
            Voltar
          </Link>
        </div>
      </div>

      {mainSection}
      {detailSection}

      <div className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Relatórios recentes</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Formato</th>
                <th>Status</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {latestRelatórios.map((relatório) => (
                <tr key={relatório.id}>
                  <td>{relatório.tipo}</td>
                  <td>{relatório.formato.toUpperCase()}</td>
                  <td>{relatório.status}</td>
                  <td className="of-mono">{relatório.url ?? "—"}</td>
                </tr>
              ))}
              {latestRelatórios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="of-empty-text">
                    Nenhuma exportação solicitada ainda.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Escopo atual</div>
        <p className="of-empty-text">
          {tipo === "diario"
            ? "Acesse o registro operacional diário por obra."
            : "Este painel consolida os dados do tipo selecionado e permite solicitar exportação no formato desejado."}
        </p>
      </div>
      </section>
    </FeatureGateWrapper>
  );
}
