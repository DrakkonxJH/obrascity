import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import {
  listAllEmpresas,
  listAllProfiles,
  listRecentSecurityAlerts,
  listRecentSignupAttempts,
} from "@/lib/db/admin-contas";
import {
  suspenderEmpresaAction,
  ativarEmpresaAction,
  alterarPlanoAction,
  removerPerfilAction,
  resetarDadosEmpresaAction,
} from "./actions";

export const dynamic = "force-dynamic";

const PLANOS = ["trial", "starter", "pro", "enterprise"];
const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const PLANO_MRR: Record<string, number> = {
  trial: 0,
  starter: 79,
  pro: 229,
  enterprise: 799,
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDatetime(d: string | null | undefined) {
  if (!d) return "Nunca";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function hashShort(h: string | null | undefined) {
  if (!h) return "—";
  return h.slice(0, 8) + "…";
}

function PlanoBadge({ plano }: { plano: string }) {
  const colors: Record<string, string> = {
    enterprise: "var(--of-purple)",
    pro: "var(--of-blue)",
    starter: "var(--of-green)",
    trial: "var(--of-text-3)",
  };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: `${colors[plano] ?? "var(--of-text-3)"}22`,
      color: colors[plano] ?? "var(--of-text-3)",
      border: `1px solid ${colors[plano] ?? "var(--of-text-3)"}44`,
    }}>
      {plano}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = ACTIVE_STATUSES.has(status);
  const color = status === "suspended" ? "var(--of-red)" : isActive ? "var(--of-green)" : "var(--of-yellow)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: "0.75rem", color,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = severity === "high" ? "var(--of-red)" : "var(--of-yellow)";
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", borderRadius: 4,
      fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase",
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {severity}
    </span>
  );
}

const TH_STYLE: React.CSSProperties = {
  textAlign: "left", padding: "10px 8px",
  fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "var(--of-text-3)",
  borderBottom: "1px solid var(--of-border)",
  whiteSpace: "nowrap",
};
const TD_STYLE: React.CSSProperties = {
  padding: "10px 8px", borderBottom: "1px solid var(--of-border)",
  fontSize: "0.85rem", color: "var(--of-text)",
  verticalAlign: "middle",
};
const BTN_SM: React.CSSProperties = {
  display: "inline-block", padding: "4px 10px", borderRadius: 6,
  fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
  border: "1px solid var(--of-border)", background: "transparent",
  color: "var(--of-text-2)",
};
const BTN_SM_RED: React.CSSProperties = { ...BTN_SM, color: "var(--of-red)", borderColor: "var(--of-red)44" };
const BTN_SM_GREEN: React.CSSProperties = { ...BTN_SM, color: "var(--of-green)", borderColor: "var(--of-green)44" };

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} style={{
      padding: "8px 18px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 500,
      background: active ? "var(--of-bg-4)" : "transparent",
      color: active ? "var(--of-text)" : "var(--of-text-3)",
      border: active ? "1px solid var(--of-border)" : "1px solid transparent",
      transition: "all 0.15s",
    }}>
      {label}
    </Link>
  );
}

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) redirect("/dashboard");

  const params = await searchParams;
  const tab = params.tab ?? "empresas";

  const [empresas, perfis, alertas, tentativas] = await Promise.all([
    listAllEmpresas(),
    listAllProfiles(),
    listRecentSecurityAlerts(50),
    listRecentSignupAttempts(30),
  ]);

  const totalAtivos = empresas.filter((e) => ACTIVE_STATUSES.has(e.assinatura_status)).length;
  const totalSuspensos = empresas.filter((e) => e.assinatura_status === "suspended").length;
  const alertasHigh = alertas.filter((a) => a.severity === "high").length;
  const empresasTrial = empresas.filter((e) => e.assinatura_status === "trialing").length;
  const empresasPagantes = empresas.filter((e) => e.assinatura_status === "active").length;
  const mrrEstimado = empresas.reduce((acc, e) => acc + (PLANO_MRR[e.plano] ?? 0), 0);
  const setup = {
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    redis: Boolean(process.env.REDIS_URL),
    turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
  };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://obrasflow.vercel.app";
  const vercelDomain = "https://obrasflow.vercel.app";

  return (
    <section className="of-page" style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="of-inline-header">
        <div>
          <h1 className="of-page-title">Controle Total</h1>
          <p className="of-page-description">
            Todas as empresas, usuários e acessos da plataforma em tempo real.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="of-kpi-grid">
        <article className="of-metric-card blue">
          <p className="of-kpi-icon">🏢</p>
          <p className="of-kpi-label">Empresas cadastradas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>{empresas.length}</p>
          <p className="of-metric-change">{totalAtivos} ativas · {totalSuspensos} suspensas</p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-icon">👥</p>
          <p className="of-kpi-label">Total de usuários</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>{perfis.length}</p>
          <p className="of-metric-change">em {empresas.length} empresas</p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-icon">🔔</p>
          <p className="of-kpi-label">Alertas de segurança</p>
          <p className="of-kpi-value" style={{ color: alertasHigh > 0 ? "var(--of-red)" : "var(--of-yellow)" }}>
            {alertas.length}
          </p>
          <p className="of-metric-change">{alertasHigh} críticos (high)</p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-icon">📋</p>
          <p className="of-kpi-label">Tentativas de cadastro</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>{tentativas.length}</p>
          <p className="of-metric-change">
            {tentativas.filter((t) => !t.success).length} falhas recentes
          </p>
        </article>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <TabLink href="/contas?tab=empresas" label="🏢 Empresas" active={tab === "empresas"} />
        <TabLink href="/contas?tab=usuarios" label="👥 Usuários" active={tab === "usuarios"} />
        <TabLink href="/contas?tab=faturamento" label="💳 Faturamento" active={tab === "faturamento"} />
        <TabLink href="/contas?tab=operacao" label="📈 Operação" active={tab === "operacao"} />
        <TabLink href="/contas?tab=integracoes" label="🔌 Integrações" active={tab === "integracoes"} />
        <TabLink href="/contas?tab=deploy" label="🚀 Deploy" active={tab === "deploy"} />
        <TabLink href="/contas?tab=seguranca" label="🔒 Segurança" active={tab === "seguranca"} />
      </div>

      {/* ── TAB: EMPRESAS ── */}
      {tab === "empresas" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 16 }}>
            Empresas ({empresas.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Empresa</th>
                  <th style={TH_STYLE}>Plano</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={TH_STYLE}>Usuários</th>
                  <th style={TH_STYLE}>Vencimento</th>
                  <th style={TH_STYLE}>Criado em</th>
                  <th style={{ ...TH_STYLE, minWidth: 320 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => {
                  const suspendAction = suspenderEmpresaAction.bind(null, emp.id);
                  const ativarAction = ativarEmpresaAction.bind(null, emp.id);
                  const changePlanAction = alterarPlanoAction.bind(null, emp.id);
                  const resetAction = resetarDadosEmpresaAction.bind(null, emp.id);
                  const isSuspended = emp.assinatura_status === "suspended";
                  return (
                    <tr key={emp.id}>
                      <td style={TD_STYLE}>
                        <span style={{ fontWeight: 500 }}>{emp.nome}</span>
                      </td>
                      <td style={TD_STYLE}><PlanoBadge plano={emp.plano} /></td>
                      <td style={TD_STYLE}><StatusBadge status={emp.assinatura_status} /></td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>{emp.profile_count}</td>
                      <td style={TD_STYLE}>{fmtDate(emp.periodo_fim)}</td>
                      <td style={TD_STYLE}>{fmtDate(emp.created_at)}</td>
                      <td style={TD_STYLE}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {/* Suspender / Ativar */}
                          {isSuspended ? (
                            <form action={ativarAction}>
                              <button type="submit" style={BTN_SM_GREEN}>Ativar</button>
                            </form>
                          ) : (
                            <form action={suspendAction}>
                              <button type="submit" style={BTN_SM_RED}>Suspender</button>
                            </form>
                          )}

                          {/* Alterar plano */}
                          <form action={changePlanAction} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <select
                              name="plano"
                              defaultValue={emp.plano}
                              style={{
                                background: "var(--of-bg-3)",
                                border: "1px solid var(--of-border)",
                                borderRadius: 5,
                                color: "var(--of-text)",
                                padding: "3px 6px",
                                fontSize: "0.72rem",
                              }}
                            >
                              {PLANOS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <button type="submit" style={BTN_SM}>Salvar plano</button>
                          </form>

                          {/* Reset dados */}
                          <form action={resetAction}>
                            <button type="submit" style={{ ...BTN_SM_RED, opacity: 0.7 }}>Reset dados</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {empresas.length === 0 && (
                  <tr><td colSpan={7} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhuma empresa encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* ── TAB: USUÁRIOS ── */}
      {tab === "usuarios" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 16 }}>
            Todos os usuários ({perfis.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Nome</th>
                  <th style={TH_STYLE}>E-mail</th>
                  <th style={TH_STYLE}>Empresa</th>
                  <th style={TH_STYLE}>Papel</th>
                  <th style={TH_STYLE}>Último acesso</th>
                  <th style={TH_STYLE}>Cadastro</th>
                  <th style={TH_STYLE}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {perfis.map((p) => {
                  const removeAction = removerPerfilAction.bind(null, p.id);
                  return (
                    <tr key={p.id}>
                      <td style={TD_STYLE}><span style={{ fontWeight: 500 }}>{p.nome}</span></td>
                      <td style={{ ...TD_STYLE, color: "var(--of-text-2)", fontSize: "0.8rem" }}>{p.email}</td>
                      <td style={TD_STYLE}>{p.empresa_nome}</td>
                      <td style={TD_STYLE}>
                        <span style={{ fontSize: "0.75rem", color: "var(--of-text-2)" }}>{p.role}</span>
                        {p.cargo && <span style={{ fontSize: "0.7rem", color: "var(--of-text-3)", display: "block" }}>{p.cargo}</span>}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem", color: p.last_sign_in_at ? "var(--of-text)" : "var(--of-text-3)" }}>
                        {fmtDatetime(p.last_sign_in_at)}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>{fmtDate(p.created_at)}</td>
                      <td style={TD_STYLE}>
                        <form action={removeAction}>
                          <button type="submit" style={BTN_SM_RED}>Remover</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {perfis.length === 0 && (
                  <tr><td colSpan={7} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {tab === "faturamento" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="of-kpi-grid">
            <article className="of-metric-card green">
              <p className="of-kpi-icon">💰</p>
              <p className="of-kpi-label">MRR estimado</p>
              <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>
                R$ {mrrEstimado.toLocaleString("pt-BR")}
              </p>
              <p className="of-metric-change">baseado no plano atual de cada empresa</p>
            </article>
            <article className="of-metric-card blue">
              <p className="of-kpi-icon">✅</p>
              <p className="of-kpi-label">Clientes pagantes</p>
              <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>{empresasPagantes}</p>
              <p className="of-metric-change">assinaturas ativas</p>
            </article>
            <article className="of-metric-card yellow">
              <p className="of-kpi-icon">🧪</p>
              <p className="of-kpi-label">Clientes em trial</p>
              <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>{empresasTrial}</p>
              <p className="of-metric-change">potencial de conversão</p>
            </article>
          </div>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 16 }}>Carteira por plano</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Plano</th>
                    <th style={TH_STYLE}>Empresas</th>
                    <th style={TH_STYLE}>MRR unitário</th>
                    <th style={TH_STYLE}>MRR total</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANOS.map((plano) => {
                    const total = empresas.filter((e) => e.plano === plano).length;
                    return (
                      <tr key={plano}>
                        <td style={TD_STYLE}><PlanoBadge plano={plano} /></td>
                        <td style={TD_STYLE}>{total}</td>
                        <td style={TD_STYLE}>R$ {(PLANO_MRR[plano] ?? 0).toLocaleString("pt-BR")}</td>
                        <td style={TD_STYLE}>R$ {((PLANO_MRR[plano] ?? 0) * total).toLocaleString("pt-BR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}

      {tab === "operacao" && (
        <div style={{ display: "grid", gap: 20 }}>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 10 }}>Operação e SLO</div>
            <p className="of-page-description" style={{ marginBottom: 12 }}>
              Monitoramento de saúde da plataforma e capacidade operacional.
            </p>
            <ul className="of-list">
              <li className="of-list-item">
                <p className="of-list-title">Healthcheck da API</p>
                <p className="of-list-description">
                  Endpoint: <a href="/api/health" style={{ color: "var(--of-blue)" }}>/api/health</a>
                </p>
              </li>
              <li className="of-list-item">
                <p className="of-list-title">Métricas de fila</p>
                <p className="of-list-description">
                  Endpoint: <a href="/api/queue/metrics" style={{ color: "var(--of-blue)" }}>/api/queue/metrics</a>
                </p>
              </li>
              <li className="of-list-item">
                <p className="of-list-title">Ops e worker</p>
                <p className="of-list-description">
                  Endpoint: <a href="/api/health/ops" style={{ color: "var(--of-blue)" }}>/api/health/ops</a>
                </p>
              </li>
            </ul>
          </article>
        </div>
      )}

      {tab === "integracoes" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Integrações críticas SaaS</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Serviço</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={TH_STYLE}>Uso principal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase", setup.supabase, "Banco, autenticação e storage"],
                  ["Stripe", setup.stripe, "Assinaturas e cobrança recorrente"],
                  ["Resend", setup.resend, "E-mails transacionais"],
                  ["Redis", setup.redis, "Fila, rate limit e cache operacional"],
                  ["Turnstile", setup.turnstile, "Anti-bot em login/cadastro"],
                ].map(([name, enabled, purpose]) => (
                  <tr key={String(name)}>
                    <td style={TD_STYLE}>{name}</td>
                    <td style={TD_STYLE}>
                      <span style={{ color: enabled ? "var(--of-green)" : "var(--of-red)", fontWeight: 600 }}>
                        {enabled ? "Configurado" : "Pendente"}
                      </span>
                    </td>
                    <td style={TD_STYLE}>{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {tab === "deploy" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Deploy, domínio e operação web</div>
          <ul className="of-list">
            <li className="of-list-item">
              <p className="of-list-title">Domínio primário</p>
              <p className="of-list-description">
                <a href={vercelDomain} style={{ color: "var(--of-blue)" }}>{vercelDomain}</a>
              </p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">URL pública da aplicação</p>
              <p className="of-list-description">
                <a href={appUrl} style={{ color: "var(--of-blue)" }}>{appUrl}</a>
              </p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Guia operacional</p>
              <p className="of-list-description">
                Consulte `DEPLOYMENT_SETUP.md` para rollback, worker, monitoramento e incidentes.
              </p>
            </li>
          </ul>
        </article>
      )}

      {/* ── TAB: SEGURANÇA ── */}
      {tab === "seguranca" && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Alertas */}
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 16 }}>
              Alertas de segurança recentes ({alertas.length})
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Categoria</th>
                    <th style={TH_STYLE}>Severidade</th>
                    <th style={TH_STYLE}>Razão</th>
                    <th style={TH_STYLE}>E-mail</th>
                    <th style={TH_STYLE}>IP (hash)</th>
                    <th style={TH_STYLE}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a) => (
                    <tr key={a.id}>
                      <td style={TD_STYLE}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--of-text-2)" }}>
                          {a.category}
                        </span>
                      </td>
                      <td style={TD_STYLE}><SeverityBadge severity={a.severity} /></td>
                      <td style={{ ...TD_STYLE, maxWidth: 260, fontSize: "0.8rem" }}>{a.reason}</td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem", color: "var(--of-text-2)" }}>{a.email ?? "—"}</td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontSize: "0.75rem", color: "var(--of-text-3)" }}>
                        {hashShort(a.ip_hash)}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>{fmtDatetime(a.created_at)}</td>
                    </tr>
                  ))}
                  {alertas.length === 0 && (
                    <tr><td colSpan={6} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhum alerta registrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          {/* Tentativas de cadastro */}
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 16 }}>
              Tentativas de cadastro recentes ({tentativas.length})
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>E-mail</th>
                    <th style={TH_STYLE}>Resultado</th>
                    <th style={TH_STYLE}>Motivo da falha</th>
                    <th style={TH_STYLE}>IP (hash)</th>
                    <th style={TH_STYLE}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {tentativas.map((t) => (
                    <tr key={t.id}>
                      <td style={{ ...TD_STYLE, fontSize: "0.82rem" }}>{t.email ?? "—"}</td>
                      <td style={TD_STYLE}>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                          background: t.success ? "var(--of-green)22" : "var(--of-red)22",
                          color: t.success ? "var(--of-green)" : "var(--of-red)",
                        }}>
                          {t.success ? "Sucesso" : "Falha"}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem", color: "var(--of-text-2)" }}>
                        {t.failure_reason ?? "—"}
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontSize: "0.75rem", color: "var(--of-text-3)" }}>
                        {hashShort(t.ip_hash)}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>{fmtDatetime(t.created_at)}</td>
                    </tr>
                  ))}
                  {tentativas.length === 0 && (
                    <tr><td colSpan={5} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhuma tentativa registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
