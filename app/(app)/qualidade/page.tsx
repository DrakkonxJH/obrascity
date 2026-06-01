import { listObras } from "@/lib/db/obras";
import {
  buildQualidadeKpis,
  listChecklistItems,
  listEvidencias,
  listNaoConformidades,
  listPlanosAcao,
  listQualidadeResponsaveis,
} from "@/lib/db/qualidade";
import {
  createChecklistAction,
  createEvidenciaAction,
  createNaoConformidadeAction,
  createPlanoAcaoAction,
  updateChecklistStatusAction,
  updateNaoConformidadeAction,
  updatePlanoAcaoStatusAction,
} from "./actions";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";

type QualidadePageProps = {
  searchParams: Promise<{
    obra?: string;
    status?: string;
    severidade?: string;
    responsavel?: string;
    from?: string;
    to?: string;
  }>;
};

function statusNcBadge(status: string) {
  if (status === "fechada") return "of-badge of-badge-green";
  if (status === "resolvida") return "of-badge of-badge-blue";
  if (status === "em_tratamento") return "of-badge of-badge-yellow";
  if (status === "reaberta") return "of-badge of-badge-red";
  return "of-badge";
}

function statusChecklistBadge(status: string) {
  if (status === "conforme") return "of-badge of-badge-green";
  if (status === "nao_conforme") return "of-badge of-badge-red";
  return "of-badge of-badge-yellow";
}

function statusPlanoBadge(status: string) {
  if (status === "concluido") return "of-badge of-badge-green";
  if (status === "em_execucao") return "of-badge of-badge-blue";
  if (status === "cancelado") return "of-badge of-badge-red";
  return "of-badge of-badge-yellow";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default async function QualidadePage({ searchParams }: QualidadePageProps) {
  const params = await searchParams;
  const filters = {
    obraId: params.obra || undefined,
    status: params.status || undefined,
    severidade: params.severidade || undefined,
    responsavelId: params.responsavel || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
  };

  let obras: Awaited<ReturnType<typeof listObras>> = [];
  let responsaveis: Awaited<ReturnType<typeof listQualidadeResponsaveis>> = [];
  let ncRows: Awaited<ReturnType<typeof listNaoConformidades>> = [];
  let checklist: Awaited<ReturnType<typeof listChecklistItems>> = [];
  let planosAcao: Awaited<ReturnType<typeof listPlanosAcao>> = [];
  let evidencias: Awaited<ReturnType<typeof listEvidencias>> = [];
  let loadError: string | null = null;

  try {
    [obras, responsaveis, ncRows, checklist] = await Promise.all([
      listObras(),
      listQualidadeResponsaveis(),
      listNaoConformidades(filters),
      listChecklistItems(filters),
    ]);
    const ncIds = ncRows.map((item) => item.id);
    [planosAcao, evidencias] = await Promise.all([listPlanosAcao(ncIds), listEvidencias(ncIds)]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar módulo de qualidade.";
  }

  const kpis = buildQualidadeKpis(ncRows);

  return (
    <FeatureGateWrapper feature="qualidade_basic">
      <section className="of-page">
      {loadError ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-red)" }}>
          <p className="of-card-title">Falha ao carregar dados de qualidade</p>
          <p className="of-empty-text">{loadError}</p>
        </article>
      ) : null}
      <PageHeader
        eyebrow="Qualidade"
        title="Qualidade e SSMA"
        subtitle="CAPA, indicadores, inspeções, evidências e rastreabilidade completa da operação."
        actions={
          <>
            <Link href="/relatorios/qualidade" className="of-btn-ghost">Ver relatório</Link>
            <Link href="/governanca" className="of-btn-primary">Abrir governança</Link>
          </>
        }
      />

      <form className="of-card of-form-grid md:grid-cols-7" style={{ marginBottom: 16 }}>
        <div className="of-card-title md:col-span-7">Filtros operacionais</div>
        <select name="obra" defaultValue={filters.obraId ?? ""} className="of-input">
          <option value="">Todas as obras</option>
          {obras.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className="of-input">
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_tratamento">Em tratamento</option>
          <option value="resolvida">Resolvida</option>
          <option value="fechada">Fechada</option>
          <option value="reaberta">Reaberta</option>
        </select>
        <select name="severidade" defaultValue={filters.severidade ?? ""} className="of-input">
          <option value="">Todas as severidades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
        <select name="responsavel" defaultValue={filters.responsavelId ?? ""} className="of-input">
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((responsavel) => (
            <option key={responsavel.id} value={responsavel.id}>
              {responsavel.nome}
            </option>
          ))}
        </select>
        <input name="from" type="date" aria-label="Data inicial" defaultValue={filters.from ?? ""} className="of-input" />
        <input name="to" type="date" aria-label="Data final" defaultValue={filters.to ?? ""} className="of-input" />
        <button type="submit" className="of-btn-primary">
          Aplicar filtros
        </button>
      </form>

      <div className="of-kpi-grid" style={{ marginBottom: 20 }}>
        <article className="of-metric-card blue">
          <p className="of-kpi-label">NC totais</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>
            {kpis.totalNc}
          </p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-label">NC abertas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>
            {kpis.abertas}
          </p>
        </article>
        <article className="of-metric-card">
          <p className="of-kpi-label">Atrasadas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-red)" }}>
            {kpis.atrasadas}
          </p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-label">Críticas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>
            {kpis.criticas}
          </p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">MTTR (dias)</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>
            {kpis.mttrDias}
          </p>
        </article>
        <article className="of-metric-card cyan">
          <p className="of-kpi-label">Reincidência</p>
          <p className="of-kpi-value" style={{ color: "var(--of-cyan)" }}>
            {kpis.taxaReincidencia}%
          </p>
        </article>
      </div>

      <form action={createNaoConformidadeAction} className="of-card of-form-grid md:grid-cols-6" style={{ marginBottom: 20 }}>
        <div className="of-card-title md:col-span-6">Nova não conformidade (RNC)</div>
        <select name="obra_id" required defaultValue="" className="of-input">
          <option value="" disabled>
            Obra
          </option>
          {obras.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>
        <input name="categoria" required placeholder="Categoria (ex.: acabamento, segurança)" className="of-input" />
        <select name="severidade" defaultValue="media" className="of-input">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
        <input name="prazo" type="date" className="of-input" />
        <select name="responsavel_id" defaultValue="" className="of-input">
          <option value="">Sem responsável</option>
          {responsaveis.map((responsavel) => (
            <option key={responsavel.id} value={responsavel.id}>
              {responsavel.nome}
            </option>
          ))}
        </select>
        <button type="submit" className="of-btn-primary">
          Registrar NC
        </button>
        <textarea
          name="descricao"
          required
          placeholder="Descrição detalhada, evidência de desvio e impacto."
          className="of-input md:col-span-6"
        />
      </form>

      <article className="of-card" style={{ marginBottom: 20 }}>
        <div className="of-card-title">Não conformidades e CAPA</div>
        <div className="of-table-wrap of-table-wrap--flat of-table-wrap--dense" style={{ marginTop: 12 }}>
          <table className="of-table of-table--dense">
            <thead>
              <tr>
                <th>NC</th>
                <th>Severidade</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Responsável</th>
                <th>Resolução / ação</th>
              </tr>
            </thead>
            <tbody>
              {ncRows.map((nc) => (
                <tr key={nc.id}>
                  <td>
                    <p className="of-list-title">{nc.categoria}</p>
                    <p className="of-list-description">{nc.obra_nome}</p>
                    <p className="of-list-description">{nc.descricao}</p>
                  </td>
                  <td>{nc.severidade}</td>
                  <td>
                    <span className={statusNcBadge(nc.status)}>{nc.status}</span>
                  </td>
                  <td>{nc.prazo ?? "—"}</td>
                  <td>{nc.responsavel_nome ?? "—"}</td>
                  <td style={{ minWidth: 300 }}>
                    <form action={updateNaoConformidadeAction} className="of-form-grid">
                      <input type="hidden" name="id" value={nc.id} />
                      <select name="status" defaultValue={nc.status} className="of-input">
                        <option value="aberta">Aberta</option>
                        <option value="em_tratamento">Em tratamento</option>
                        <option value="resolvida">Resolvida</option>
                        <option value="fechada">Fechada</option>
                        <option value="reaberta">Reaberta</option>
                      </select>
                      <select name="severidade" defaultValue={nc.severidade} className="of-input">
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                      <input name="prazo" type="date" defaultValue={nc.prazo ?? ""} className="of-input" />
                      <select name="responsavel_id" defaultValue={nc.responsavel_id ?? ""} className="of-input">
                        <option value="">Sem responsável</option>
                        {responsaveis.map((responsavel) => (
                          <option key={responsavel.id} value={responsavel.id}>
                            {responsavel.nome}
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="resolucao"
                        defaultValue={nc.resolucao}
                        placeholder="Causa raiz e ação corretiva/preventiva"
                        className="of-input"
                      />
                      <button type="submit" className="of-btn-ghost">
                        Atualizar NC
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {ncRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="of-empty-text">
                    Nenhuma não conformidade para os filtros informados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <div className="of-dashboard-grid" style={{ marginBottom: 20 }}>
        <article className="of-card">
          <div className="of-card-title">Planos de ação</div>
          <form action={createPlanoAcaoAction} className="of-form-grid" style={{ marginTop: 12 }}>
            <select name="nao_conformidade_id" required defaultValue="" className="of-input">
              <option value="" disabled>
                Selecione a NC
              </option>
              {ncRows.map((nc) => (
                <option key={nc.id} value={nc.id}>
                  {nc.categoria} · {nc.obra_nome}
                </option>
              ))}
            </select>
            <input name="titulo" required placeholder="Título da ação" className="of-input" />
            <textarea name="descricao" placeholder="Descrição da ação corretiva/preventiva" className="of-input" />
            <input name="prazo" type="date" className="of-input" />
            <select name="responsavel_id" defaultValue="" className="of-input">
              <option value="">Sem responsável</option>
              {responsaveis.map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>
                  {responsavel.nome}
                </option>
              ))}
            </select>
            <button type="submit" className="of-btn-primary">
              Criar plano
            </button>
          </form>
          <ul className="of-list" style={{ marginTop: 14 }}>
            {planosAcao.map((plano) => (
              <li key={plano.id} className="of-list-item">
                <p className="of-list-title">{plano.titulo}</p>
                <p className="of-list-description">
                  {plano.responsavel_nome ?? "Sem responsável"} · Prazo {plano.prazo ?? "—"} ·{" "}
                  <span className={statusPlanoBadge(plano.status)}>{plano.status}</span>
                </p>
                {plano.descricao ? <p className="of-list-description">{plano.descricao}</p> : null}
                <form action={updatePlanoAcaoStatusAction} style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <input type="hidden" name="id" value={plano.id} />
                  <select name="status" defaultValue={plano.status} className="of-input">
                    <option value="pendente">Pendente</option>
                    <option value="em_execucao">Em execução</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  <button type="submit" className="of-btn-ghost">
                    Atualizar
                  </button>
                </form>
              </li>
            ))}
            {planosAcao.length === 0 ? <li className="of-empty-text">Nenhum plano de ação registrado.</li> : null}
          </ul>
        </article>

        <article className="of-card">
          <div className="of-card-title">Evidências</div>
          <form action={createEvidenciaAction} className="of-form-grid" style={{ marginTop: 12 }}>
            <select name="nao_conformidade_id" required defaultValue="" className="of-input">
              <option value="" disabled>
                Selecione a NC
              </option>
              {ncRows.map((nc) => (
                <option key={nc.id} value={nc.id}>
                  {nc.categoria} · {nc.obra_nome}
                </option>
              ))}
            </select>
            <input name="url" required placeholder="URL da foto ou documento" className="of-input" />
            <textarea name="descricao" placeholder="Descrição da evidência" className="of-input" />
            <button type="submit" className="of-btn-primary">
              Anexar evidência
            </button>
          </form>
          <ul className="of-list" style={{ marginTop: 14 }}>
            {evidencias.map((evidencia) => (
              <li key={evidencia.id} className="of-list-item">
                <p className="of-list-title">
                  <a href={evidencia.url} target="_blank" rel="noreferrer">
                    {evidencia.url}
                  </a>
                </p>
                <p className="of-list-description">
                  {evidencia.descricao || "Sem descrição"} · {evidencia.created_by_nome ?? "Usuário"} ·{" "}
                  {formatDate(evidencia.created_at)}
                </p>
              </li>
            ))}
            {evidencias.length === 0 ? <li className="of-empty-text">Nenhuma evidência cadastrada.</li> : null}
          </ul>
        </article>
      </div>

      <article className="of-card">
        <div className="of-card-title">Inspeções e checklist SSMA</div>
        <form action={createChecklistAction} className="of-form-grid md:grid-cols-6" style={{ marginTop: 12, marginBottom: 16 }}>
          <select name="obra_id" required defaultValue="" className="of-input">
            <option value="" disabled>
              Obra
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <input name="norma" required placeholder="Norma (NR-18, NBR etc.)" className="of-input" />
          <input name="item" required placeholder="Item de inspeção" className="of-input" />
          <select name="status" defaultValue="pendente" className="of-input">
            <option value="pendente">Pendente</option>
            <option value="conforme">Conforme</option>
            <option value="nao_conforme">Não conforme</option>
          </select>
          <select name="responsavel_id" defaultValue="" className="of-input">
            <option value="">Sem responsável</option>
            {responsaveis.map((responsavel) => (
              <option key={responsavel.id} value={responsavel.id}>
                {responsavel.nome}
              </option>
            ))}
          </select>
          <button type="submit" className="of-btn-primary">
            Inspeção
          </button>
          <textarea name="observacao" placeholder="Observações da inspeção" className="of-input md:col-span-6" />
        </form>

        <div className="of-table-wrap of-table-wrap--flat of-table-wrap--dense">
          <table className="of-table of-table--dense">
            <thead>
              <tr>
                <th>Norma / Item</th>
                <th>Obra</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Última inspeção</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="of-list-title">
                      {item.norma} — {item.item}
                    </p>
                    <p className="of-list-description">{item.observacao || "Sem observação"}</p>
                  </td>
                  <td>{item.obra_nome}</td>
                  <td>
                    <span className={statusChecklistBadge(item.status)}>{item.status}</span>
                  </td>
                  <td>{item.responsavel_nome ?? "—"}</td>
                  <td>{formatDate(item.inspecionado_em)}</td>
                  <td style={{ minWidth: 280 }}>
                    <form action={updateChecklistStatusAction} className="of-form-grid">
                      <input type="hidden" name="id" value={item.id} />
                      <select name="status" defaultValue={item.status} className="of-input">
                        <option value="pendente">Pendente</option>
                        <option value="conforme">Conforme</option>
                        <option value="nao_conforme">Não conforme</option>
                      </select>
                      <select name="responsavel_id" defaultValue={item.responsavel_id ?? ""} className="of-input">
                        <option value="">Sem responsável</option>
                        {responsaveis.map((responsavel) => (
                          <option key={responsavel.id} value={responsavel.id}>
                            {responsavel.nome}
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="observacao"
                        defaultValue={item.observacao}
                        placeholder="Observações da inspeção"
                        className="of-input"
                      />
                      <button type="submit" className="of-btn-ghost">
                        Atualizar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {checklist.length === 0 ? (
                <tr>
                  <td colSpan={6} className="of-empty-text">
                    Nenhum item de inspeção para os filtros atuais.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
      </section>
    </FeatureGateWrapper>
  );
}
