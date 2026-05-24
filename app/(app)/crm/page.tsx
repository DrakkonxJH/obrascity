import Link from "next/link";
import { CrmKanban } from "@/components/crm/crm-kanban";
import { CRM_STAGES, listCrmActivities, listCrmCompanies, listCrmContacts, listCrmDeals } from "@/lib/db/crm";
import { createCrmActivityAction, createCrmDealAction } from "./actions";

const TABS = [
  { key: "negocios", label: "Negocios" },
  { key: "contatos", label: "Contatos" },
  { key: "empresas", label: "Empresas" },
  { key: "atividades", label: "Atividades" },
  { key: "relatorios", label: "Relatorios" },
] as const;

const STAGE_LABEL: Record<string, string> = {
  novos: "Novos",
  qualificacao: "Qualificacao",
  proposta: "Proposta",
  negociacao: "Negociacao",
  fechado_ganho: "Fechado ganho",
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function fmtDatetime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function withParams(params: { tab: string; view?: string; q?: string; stage?: string }, next: Partial<typeof params>) {
  const merged = { ...params, ...next };
  const url = new URLSearchParams();
  if (merged.tab) url.set("tab", merged.tab);
  if (merged.view) url.set("view", merged.view);
  if (merged.q) url.set("q", merged.q);
  if (merged.stage) url.set("stage", merged.stage);
  return `/crm?${url.toString()}`;
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string; q?: string; stage?: string }>;
}) {
  const params = await searchParams;
  const tab = TABS.some((item) => item.key === params.tab) ? (params.tab as (typeof TABS)[number]["key"]) : "negocios";
  const view = params.view === "lista" || params.view === "calendario" ? params.view : "kanban";
  const q = String(params.q ?? "").trim().toLowerCase();
  const stageFilter = String(params.stage ?? "").trim().toLowerCase();

  const [dealsResult, contactsResult, companiesResult, activitiesResult] = await Promise.all([
    listCrmDeals()
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar negocios CRM",
      })),
    listCrmContacts()
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar contatos CRM",
      })),
    listCrmCompanies()
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar empresas CRM",
      })),
    listCrmActivities(120)
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar atividades CRM",
      })),
  ]);
  const deals = dealsResult.data;
  const contacts = contactsResult.data;
  const companies = companiesResult.data;
  const activities = activitiesResult.data;
  const dealsError = dealsResult.error;
  const contactsError = contactsResult.error;
  const companiesError = companiesResult.error;
  const activitiesError = activitiesResult.error;

  const filteredDeals = deals.filter((deal) => {
    if (stageFilter && deal.stage !== stageFilter) return false;
    if (!q) return true;
    const row = [deal.nome, deal.empresa_nome, deal.contato_nome, deal.owner_nome, ...deal.tags]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return row.includes(q);
  });

  const activitiesByDate = activities.reduce<Record<string, typeof activities>>((acc, item) => {
    const key = item.due_at ? fmtDate(item.due_at) : "Sem data";
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});

  const totalPipeline = filteredDeals.reduce((sum, deal) => sum + deal.valor, 0);
  const wonDeals = filteredDeals.filter((deal) => deal.stage === "fechado_ganho");
  const conversion = filteredDeals.length > 0 ? Math.round((wonDeals.length / filteredDeals.length) * 100) : 0;
  const noActivityCount = filteredDeals.filter((deal) => !deal.last_activity_at).length;

  const missingTablesMessage =
    [dealsError, contactsError, companiesError, activitiesError].join(" ").toLowerCase().includes("does not exist") ||
    [dealsError, contactsError, companiesError, activitiesError].join(" ").toLowerCase().includes("relation")
      ? "As tabelas do CRM ainda nao existem no banco. Execute a migration 0020_crm_module.sql para liberar o modulo completo."
      : null;

  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 16, alignItems: "center" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            CRM de Obras
          </h1>
          <p className="of-empty-text">
            Pipeline comercial com visoes Negocios, Contatos, Empresas, Atividades e relatorios de conversao.
          </p>
        </div>
      </div>

      {missingTablesMessage ? (
        <article className="of-card" style={{ borderColor: "var(--of-yellow)", marginBottom: 16 }}>
          <p className="of-card-title">CRM aguardando estrutura de banco</p>
          <p className="of-empty-text">{missingTablesMessage}</p>
        </article>
      ) : null}

      <article className="of-card" style={{ marginBottom: 14, padding: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((item) => (
            <Link
              key={item.key}
              href={withParams({ tab, view, q, stage: stageFilter }, { tab: item.key })}
              className={item.key === tab ? "of-btn-primary" : "of-btn-ghost"}
              style={{ minHeight: 36 }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <form action="/crm" method="get" style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr auto", alignItems: "center" }}>
          <input name="q" className="of-input" defaultValue={q} placeholder="Buscar negocios, clientes, tags e responsavel..." />
          <select name="stage" defaultValue={stageFilter} className="of-input">
            <option value="">Todas as etapas</option>
            {CRM_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </option>
            ))}
          </select>
          <select name="view" defaultValue={view} className="of-input">
            <option value="kanban">Visao Kanban</option>
            <option value="lista">Visao Lista</option>
            <option value="calendario">Visao Calendario</option>
          </select>
          <button type="submit" className="of-btn-ghost">
            Aplicar
          </button>
          <input type="hidden" name="tab" value={tab} />
        </form>
      </article>

      <div className="of-kpi-grid" style={{ marginBottom: 16 }}>
        <article className="of-metric-card blue">
          <p className="of-kpi-label">Negocios no funil</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>{filteredDeals.length}</p>
          <p className="of-metric-change">{noActivityCount} sem atividade recente</p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-label">Valor total</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>{money.format(totalPipeline)}</p>
          <p className="of-metric-change">Pipeline atual</p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-label">Conversao</p>
          <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>{conversion}%</p>
          <p className="of-metric-change">{wonDeals.length} ganhos</p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-label">Follow-ups abertos</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>{activities.filter((item) => !item.done).length}</p>
          <p className="of-metric-change">{activities.length} atividades totais</p>
        </article>
      </div>

      {tab === "negocios" ? (
        <>
          <article className="of-card" style={{ marginBottom: 16 }}>
            <div className="of-card-title">Novo negocio</div>
            <form action={createCrmDealAction} className="of-form-grid md:grid-cols-5">
              <input name="nome" className="of-input" placeholder="Nome do negocio" required />
              <input name="valor" className="of-input" type="number" min="0" step="0.01" placeholder="Valor estimado" required />
              <select name="stage" className="of-input" defaultValue="novos">
                {CRM_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABEL[stage]}
                  </option>
                ))}
              </select>
              <select name="priority" className="of-input" defaultValue="media">
                <option value="baixa">Prioridade baixa</option>
                <option value="media">Prioridade media</option>
                <option value="alta">Prioridade alta</option>
              </select>
              <input name="tags" className="of-input" placeholder="Tags separadas por virgula" />
              <button type="submit" className="of-btn-primary" style={{ minHeight: 44 }}>
                + Criar negocio
              </button>
            </form>
          </article>

          {view === "kanban" ? <CrmKanban deals={filteredDeals} /> : null}

          {view === "lista" ? (
            <article className="of-card">
              <div className="of-card-title" style={{ marginBottom: 12 }}>Lista de negocios</div>
              <div className="of-table-wrap" style={{ border: 0 }}>
                <table className="of-table">
                  <thead>
                    <tr>
                      <th>Negocio</th>
                      <th>Etapa</th>
                      <th>Empresa</th>
                      <th>Responsavel</th>
                      <th>Valor</th>
                      <th>Prox. atividade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((deal) => (
                      <tr key={deal.id}>
                        <td>{deal.nome}</td>
                        <td>{STAGE_LABEL[deal.stage]}</td>
                        <td>{deal.empresa_nome ?? "—"}</td>
                        <td>{deal.owner_nome ?? "—"}</td>
                        <td>{money.format(deal.valor)}</td>
                        <td>{fmtDatetime(deal.next_activity_at)}</td>
                      </tr>
                    ))}
                    {filteredDeals.length === 0 ? (
                      <tr><td colSpan={6}>Nenhum negocio encontrado.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}

          {view === "calendario" ? (
            <article className="of-card">
              <div className="of-card-title" style={{ marginBottom: 12 }}>Calendario de atividades</div>
              <div className="of-dashboard-grid">
                {Object.entries(activitiesByDate).map(([date, items]) => (
                  <article key={date} className="of-card" style={{ margin: 0 }}>
                    <p className="of-card-title">{date}</p>
                    <ul className="of-list">
                      {items.map((item) => (
                        <li key={item.id} className="of-list-item">
                          <p className="of-list-title">{item.deal_nome}</p>
                          <p className="of-list-description">{item.descricao}</p>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
                {Object.keys(activitiesByDate).length === 0 ? <p className="of-empty-text">Sem atividades com data.</p> : null}
              </div>
            </article>
          ) : null}
        </>
      ) : null}

      {tab === "contatos" ? (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Contatos</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Empresa</th>
                  <th>Cargo</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.nome}</td>
                    <td>{contact.company_nome ?? "—"}</td>
                    <td>{contact.cargo ?? "—"}</td>
                    <td>{contact.email ?? "—"}</td>
                    <td>{contact.telefone ?? "—"}</td>
                  </tr>
                ))}
                {contacts.length === 0 ? <tr><td colSpan={5}>Sem contatos cadastrados.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {tab === "empresas" ? (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Empresas CRM</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Segmento</th>
                  <th>Cidade</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.nome}</td>
                    <td>{company.segmento ?? "—"}</td>
                    <td>{company.cidade ?? "—"}</td>
                  </tr>
                ))}
                {companies.length === 0 ? <tr><td colSpan={3}>Sem empresas CRM cadastradas.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {tab === "atividades" ? (
        <>
          <article className="of-card" style={{ marginBottom: 16 }}>
            <div className="of-card-title">Nova atividade</div>
            <form action={createCrmActivityAction} className="of-form-grid md:grid-cols-4">
              <select name="deal_id" className="of-input" required>
                <option value="">Selecionar negocio</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.nome}
                  </option>
                ))}
              </select>
              <input name="tipo" className="of-input" defaultValue="follow_up" />
              <input name="due_at" type="datetime-local" className="of-input" />
              <input name="descricao" className="of-input" placeholder="Descricao da atividade" required />
              <button type="submit" className="of-btn-primary" style={{ minHeight: 44 }}>
                + Registrar atividade
              </button>
            </form>
          </article>

          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Atividades registradas</div>
            <div className="of-table-wrap" style={{ border: 0 }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Negocio</th>
                    <th>Tipo</th>
                    <th>Descricao</th>
                    <th>Prazo</th>
                    <th>Status</th>
                    <th>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.deal_nome}</td>
                      <td>{activity.tipo}</td>
                      <td>{activity.descricao}</td>
                      <td>{fmtDatetime(activity.due_at)}</td>
                      <td>{activity.done ? "Concluida" : "Aberta"}</td>
                      <td>{fmtDatetime(activity.created_at)}</td>
                    </tr>
                  ))}
                  {activities.length === 0 ? <tr><td colSpan={6}>Sem atividades registradas.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}

      {tab === "relatorios" ? (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Relatorio do funil</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Negocios</th>
                  <th>Valor acumulado</th>
                  <th>Ticket medio</th>
                </tr>
              </thead>
              <tbody>
                {CRM_STAGES.map((stage) => {
                  const rows = deals.filter((deal) => deal.stage === stage);
                  const total = rows.reduce((sum, deal) => sum + deal.valor, 0);
                  const avg = rows.length > 0 ? total / rows.length : 0;
                  return (
                    <tr key={stage}>
                      <td>{STAGE_LABEL[stage]}</td>
                      <td>{rows.length}</td>
                      <td>{money.format(total)}</td>
                      <td>{money.format(avg)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
