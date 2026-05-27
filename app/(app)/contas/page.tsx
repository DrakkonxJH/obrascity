import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { OpsAiAssistant } from "@/components/master/ops-ai-assistant";
import { OpsTerminal } from "@/components/master/ops-terminal";
import { ASSIGNABLE_PROFILE_ROLE_OPTIONS, PROFILE_ROLE_LABEL } from "@/lib/auth/roles";
import {
  listAllEmpresas,
  listAllProfiles,
  listMasterAuditLogs,
  listRecentSecurityAlerts,
  listRecentSignupAttempts,
  listSupportTickets,
} from "@/lib/db/admin-contas";
import {
  listTenantAdminOverrides,
  listTenantBroadcasts,
  listTenantFeatureFlags,
  listTenantImpersonationSessions,
} from "@/lib/db/master-admin";
import {
  suspenderEmpresaAction,
  ativarEmpresaAction,
  alterarPlanoAction,
  atualizarPerfilUsuarioAction,
  atualizarSecurityAlertAction,
  atualizarTicketSuporteAction,
  criarTicketSuporteAction,
  estenderPeriodoEmpresaAction,
  removerPerfilAction,
  resetarSenhaUsuarioAction,
  resetarDadosEmpresaAction,
  salvarFeatureFlagAction,
  salvarLimitesEmpresaAction,
  removerFeatureFlagAction,
  criarComunicadoTenantAction,
  iniciarAcessoAssistidoAction,
  encerrarAcessoAssistidoAction,
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
const MASTER_TABS = [
  { key: "empresas", label: "Empresas" },
  { key: "usuarios", label: "Usuários" },
  { key: "faturamento", label: "Faturamento" },
  { key: "operacao", label: "IA de operações" },
  { key: "seguranca", label: "Segurança" },
  { key: "suporte", label: "Suporte" },
  { key: "auditoria", label: "Auditoria" },
  { key: "runbooks", label: "Runbooks" },
  { key: "impersonacao", label: "Acesso assistido" },
  { key: "limites", label: "Limites e quotas" },
  { key: "flags", label: "Feature flags" },
  { key: "comunicacao", label: "Comunicação" },
  { key: "health", label: "Health" },
  { key: "terminal", label: "Terminal" },
  { key: "integracoes", label: "Integrações" },
  { key: "deploy", label: "Deploy" },
];

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

function AlertStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    open: { label: "Aberto", color: "var(--of-red)" },
    in_progress: { label: "Em análise", color: "var(--of-yellow)" },
    resolved: { label: "Resolvido", color: "var(--of-green)" },
    ignored: { label: "Ignorado", color: "var(--of-text-3)" },
  };
  const item = map[status] ?? { label: status, color: "var(--of-text-2)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
        background: `${item.color}22`,
        color: item.color,
        border: `1px solid ${item.color}44`,
      }}
    >
      {item.label}
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

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) redirect("/dashboard");

  const params = await searchParams;
  const tab = params.tab ?? "empresas";
  const auditQuery = String(params.q ?? "").trim().toLowerCase();

  const [empresas, perfis, alertas, tentativas, tickets, auditLogs, overrides, featureFlags, sessions, broadcasts] = await Promise.all([
    listAllEmpresas(),
    listAllProfiles(),
    listRecentSecurityAlerts(50),
    listRecentSignupAttempts(30),
    listSupportTickets(120),
    listMasterAuditLogs(150),
    listTenantAdminOverrides(),
    listTenantFeatureFlags(),
    listTenantImpersonationSessions(),
    listTenantBroadcasts(),
  ]);

  const totalAtivos = empresas.filter((e) => ACTIVE_STATUSES.has(e.assinatura_status)).length;
  const totalSuspensos = empresas.filter((e) => e.assinatura_status === "suspended").length;
  const alertasHigh = alertas.filter((a) => a.severity === "high").length;
  const empresasTrial = empresas.filter((e) => e.assinatura_status === "trialing").length;
  const empresasPagantes = empresas.filter((e) => e.assinatura_status === "active").length;
  const mrrEstimado = empresas.reduce((acc, e) => acc + (PLANO_MRR[e.plano] ?? 0), 0);
  const ticketsAbertos = tickets.filter((t) => t.status !== "resolvido" && t.status !== "fechado").length;
  const totalObras = empresas.reduce((acc, e) => acc + (e.obra_count ?? 0), 0);
  const totalObrasAtivas = empresas.reduce((acc, e) => acc + (e.active_obra_count ?? 0), 0);
  const totalStorageEstimate = empresas.reduce((acc, e) => acc + (e.storage_estimate_mb ?? 0), 0);
  const openAssistSessions = sessions.filter((session) => session.active && !session.revoked_at).length;
  const enabledFlags = featureFlags.filter((flag) => flag.enabled).length;
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditQuery) return true;
    const haystack = [
      log.actor_email,
      log.action,
      log.target_type,
      log.target_id,
      log.empresa_nome,
      JSON.stringify(log.details ?? {}),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(auditQuery);
  });
  const setup = {
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    redis: Boolean(process.env.REDIS_URL),
    turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
  };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://obrascity.com.br";
  const vercelDomain = "https://obrascity.com.br";

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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MASTER_TABS.map((item) => {
          const href = item.key === "auditoria" && params.q ? `/contas?tab=${item.key}&q=${encodeURIComponent(params.q)}` : `/contas?tab=${item.key}`;
          return (
            <Link
              key={item.key}
              href={href}
              className={tab === item.key ? "of-btn-primary" : "of-btn-ghost"}
              style={{ minHeight: 36, alignContent: "center" }}
            >
              {item.label}
            </Link>
          );
        })}
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
        <Link
          href="/contas?tab=seguranca"
          className="of-metric-card yellow"
          style={{ textDecoration: "none", color: "inherit", display: "block", cursor: "pointer" }}
          aria-label="Ver alertas de segurança"
        >
          <p className="of-kpi-icon">🔔</p>
          <p className="of-kpi-label">Alertas de segurança</p>
          <p className="of-kpi-value" style={{ color: alertasHigh > 0 ? "var(--of-red)" : "var(--of-yellow)" }}>
            {alertas.length}
          </p>
          <p className="of-metric-change">{alertasHigh} críticos (high)</p>
        </Link>
        <article className="of-metric-card purple">
          <p className="of-kpi-icon">📋</p>
          <p className="of-kpi-label">Tentativas de cadastro</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>{tentativas.length}</p>
          <p className="of-metric-change">
            {tentativas.filter((t) => !t.success).length} falhas recentes
          </p>
        </article>
        <article className="of-metric-card">
          <p className="of-kpi-icon">🏗️</p>
          <p className="of-kpi-label">Obras ativas</p>
          <p className="of-kpi-value">{totalObrasAtivas}</p>
          <p className="of-metric-change">{totalObras} obras no total</p>
        </article>
        <article className="of-metric-card">
          <p className="of-kpi-icon">💾</p>
          <p className="of-kpi-label">Storage estimado</p>
          <p className="of-kpi-value">{totalStorageEstimate.toFixed(1)} MB</p>
          <p className="of-metric-change">baseado em mídia, relatórios e diários</p>
        </article>
        <article className="of-metric-card">
          <p className="of-kpi-icon">🏁</p>
          <p className="of-kpi-label">Feature flags ativas</p>
          <p className="of-kpi-value">{enabledFlags}</p>
          <p className="of-metric-change">de {featureFlags.length} registradas</p>
        </article>
        <Link
          href="/contas?tab=impersonacao"
          className="of-metric-card"
          style={{ textDecoration: "none", color: "inherit", display: "block", cursor: "pointer" }}
        >
          <p className="of-kpi-icon">🪪</p>
          <p className="of-kpi-label">Acessos assistidos</p>
          <p className="of-kpi-value">{openAssistSessions}</p>
          <p className="of-metric-change">sessões abertas para suporte</p>
        </Link>
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
                  <th style={TH_STYLE}>Obras</th>
                  <th style={TH_STYLE}>Última atividade</th>
                  <th style={TH_STYLE}>Storage</th>
                  <th style={TH_STYLE}>Overrides</th>
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
                  const extendAction = estenderPeriodoEmpresaAction.bind(null, emp.id);
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
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>{emp.active_obra_count}/{emp.obra_count}</td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>{fmtDatetime(emp.last_activity_at)}</td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>{emp.storage_estimate_mb.toFixed(1)} MB</td>
                      <td style={{ ...TD_STYLE, fontSize: "0.75rem" }}>
                        {emp.profile_limit_override || emp.report_daily_limit_override || emp.feature_flag_count
                          ? `${emp.profile_limit_override ?? "—"} perfis · ${emp.report_daily_limit_override ?? "—"} relatórios · ${emp.feature_flag_count} flags`
                          : "Padrão do plano"}
                      </td>
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

                          <form action={extendAction} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input
                              type="number"
                              name="days"
                              min={1}
                              defaultValue={7}
                              style={{
                                width: 64,
                                background: "var(--of-bg-3)",
                                border: "1px solid var(--of-border)",
                                borderRadius: 5,
                                color: "var(--of-text)",
                                padding: "3px 6px",
                                fontSize: "0.72rem",
                              }}
                            />
                            <button type="submit" style={BTN_SM}>+ prazo</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {empresas.length === 0 && (
                  <tr><td colSpan={11} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhuma empresa encontrada.</td></tr>
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
                  const resetPasswordAction = resetarSenhaUsuarioAction.bind(null, p.id);
                  const updateProfileAction = atualizarPerfilUsuarioAction.bind(null, p.id);
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
                        <div style={{ display: "grid", gap: 8 }}>
                          <form action={updateProfileAction} style={{ display: "grid", gap: 4 }}>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                              <select
                                name="role"
                                defaultValue={p.role === "master" ? "" : p.role}
                                disabled={p.role === "master"}
                                style={{
                                  minWidth: 140,
                                  background: "var(--of-bg-3)",
                                  border: "1px solid var(--of-border)",
                                  borderRadius: 5,
                                  color: "var(--of-text)",
                                  padding: "3px 6px",
                                  fontSize: "0.72rem",
                                }}
                              >
                                <option value="">{p.role === "master" ? "Master" : "Papel"}</option>
                                {ASSIGNABLE_PROFILE_ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {PROFILE_ROLE_LABEL[role]}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                name="cargo"
                                defaultValue={p.cargo ?? ""}
                                placeholder="Cargo"
                                style={{
                                  minWidth: 120,
                                  background: "var(--of-bg-3)",
                                  border: "1px solid var(--of-border)",
                                  borderRadius: 5,
                                  color: "var(--of-text)",
                                  padding: "3px 6px",
                                  fontSize: "0.72rem",
                                }}
                              />
                              <button type="submit" style={BTN_SM}>Salvar</button>
                            </div>
                          </form>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <form action={removeAction}>
                              <button type="submit" style={BTN_SM_RED}>Remover</button>
                            </form>
                            <form action={resetPasswordAction} style={{ display: "flex", gap: 4 }}>
                              <input
                                type="text"
                                name="password"
                                placeholder="Nova senha"
                                style={{
                                  width: 120,
                                  background: "var(--of-bg-3)",
                                  border: "1px solid var(--of-border)",
                                  borderRadius: 5,
                                  color: "var(--of-text)",
                                  padding: "3px 6px",
                                  fontSize: "0.72rem",
                                }}
                              />
                              <button type="submit" style={BTN_SM}>Reset senha</button>
                            </form>
                          </div>
                        </div>
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
          <div className="of-kpi-grid">
            <article className="of-metric-card yellow">
              <p className="of-kpi-icon">🎫</p>
              <p className="of-kpi-label">Tickets em aberto</p>
              <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>{ticketsAbertos}</p>
              <p className="of-metric-change">incidentes e solicitações ativos</p>
            </article>
          </div>

          <OpsAiAssistant />

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
                  ["Bull Board", true, "Visualização das filas BullMQ"],
                  ["Sentry/Axiom", false, "Logs e erros de produção"],
                  ["Vercel Analytics", false, "Métricas de infra e navegação"],
                  ["Instatus/BetterUptime", false, "Status page pública"],
                  ["Intercom/Crisp/Plain", false, "Comunicação com clientes"],
                  ["Dependabot", false, "Monitoramento de dependências"],
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

      {tab === "suporte" && (
        <div style={{ display: "grid", gap: 20 }}>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Novo ticket de suporte</div>
            <form action={criarTicketSuporteAction} className="of-form-grid md:grid-cols-6">
              <select name="empresa_id" required className="of-input">
                <option value="">Empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              <input name="title" className="of-input" placeholder="Título do ticket" required />
              <input name="category" className="of-input" defaultValue="suporte" placeholder="Categoria" />
              <select name="priority" defaultValue="media" className="of-input">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
              <input
                name="sla_hours"
                type="number"
                min={1}
                defaultValue={24}
                className="of-input"
                placeholder="SLA (h)"
              />
              <button type="submit" className="of-btn-primary">Abrir ticket</button>
              <textarea
                name="description"
                className="of-input md:col-span-6"
                placeholder="Descrição técnica, impacto e contexto."
              />
            </form>
          </article>

          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Fila de suporte ({tickets.length})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Empresa</th>
                    <th style={TH_STYLE}>Ticket</th>
                    <th style={TH_STYLE}>Prioridade</th>
                    <th style={TH_STYLE}>Status</th>
                    <th style={TH_STYLE}>Dono</th>
                    <th style={TH_STYLE}>SLA</th>
                    <th style={TH_STYLE}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const updateAction = atualizarTicketSuporteAction.bind(null, ticket.id);
                    return (
                      <tr key={ticket.id}>
                        <td style={TD_STYLE}>{ticket.empresa_nome}</td>
                        <td style={TD_STYLE}>
                          <p style={{ margin: 0, fontWeight: 600 }}>{ticket.title}</p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--of-text-3)" }}>
                            {ticket.category}
                          </p>
                        </td>
                        <td style={TD_STYLE}>{ticket.priority}</td>
                        <td style={TD_STYLE}>{ticket.status}</td>
                        <td style={TD_STYLE}>{ticket.owner_nome ?? "—"}</td>
                        <td style={TD_STYLE}>{fmtDatetime(ticket.sla_deadline)}</td>
                        <td style={TD_STYLE}>
                          <form action={updateAction} style={{ display: "grid", gap: 4 }}>
                            <select name="status" defaultValue={ticket.status} className="of-input">
                              <option value="aberto">Aberto</option>
                              <option value="em_andamento">Em andamento</option>
                              <option value="aguardando_cliente">Aguardando cliente</option>
                              <option value="resolvido">Resolvido</option>
                              <option value="fechado">Fechado</option>
                            </select>
                            <select name="owner_profile_id" defaultValue={ticket.owner_profile_id ?? ""} className="of-input">
                              <option value="">Sem dono</option>
                              {perfis.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nome}
                                </option>
                              ))}
                            </select>
                            <input name="comment" className="of-input" placeholder="Comentário de atualização" />
                            <button type="submit" style={BTN_SM}>Atualizar</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                  {tickets.length === 0 ? (
                    <tr><td colSpan={7} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhum ticket na fila.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}

      {tab === "auditoria" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>
            Trilhas de auditoria do MASTER ({filteredAuditLogs.length})
          </div>
          <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <input type="hidden" name="tab" value="auditoria" />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar por ação, ator, alvo ou empresa"
              className="of-input"
              style={{ maxWidth: 340 }}
            />
            <button type="submit" className="of-btn-primary">Filtrar</button>
            {auditQuery ? (
              <a
                href="/contas?tab=auditoria"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--of-border)",
                  background: "transparent",
                  color: "var(--of-text-2)",
                  fontWeight: 600,
                }}
              >
                Limpar
              </a>
            ) : null}
          </form>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Quando</th>
                  <th style={TH_STYLE}>Ator</th>
                  <th style={TH_STYLE}>Ação</th>
                  <th style={TH_STYLE}>Alvo</th>
                  <th style={TH_STYLE}>Empresa</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={TD_STYLE}>{fmtDatetime(log.created_at)}</td>
                    <td style={TD_STYLE}>{log.actor_email ?? "—"}</td>
                    <td style={TD_STYLE}>{log.action}</td>
                    <td style={TD_STYLE}>{log.target_type}{log.target_id ? ` · ${log.target_id}` : ""}</td>
                    <td style={TD_STYLE}>{log.empresa_nome ?? "Plataforma"}</td>
                  </tr>
                ))}
                {filteredAuditLogs.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Sem registros de auditoria.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {tab === "runbooks" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Runbooks de suporte e incidentes</div>
          <ul className="of-list">
            <li className="of-list-item">
              <p className="of-list-title">Login e autenticação indisponíveis</p>
              <p className="of-list-description">Checar Supabase Auth, rate-limit, status de sessão e alertas de login.</p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Cobrança/assinatura divergente</p>
              <p className="of-list-description">Comparar assinatura local x eventos Stripe e reprocessar webhook se necessário.</p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Fila/worker travado</p>
              <p className="of-list-description">Validar `/api/health/ops`, métricas de fila e reiniciar processo contínuo do worker.</p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Recuperação de tenant</p>
              <p className="of-list-description">Avaliar impacto, executar reset controlado por empresa e registrar auditoria.</p>
            </li>
          </ul>
        </article>
      )}

      {tab === "impersonacao" && (
        <div style={{ display: "grid", gap: 20 }}>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Acesso assistido</div>
            <p className="of-list-description" style={{ marginBottom: 12 }}>
              Registra uma sessão assistida para reproduzir um problema do tenant sem depender da senha do cliente.
            </p>
            <form action={iniciarAcessoAssistidoAction} className="of-form-grid md:grid-cols-4">
              <select name="empresa_id" className="of-input" required>
                <option value="">Empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                  </option>
                ))}
              </select>
              <select name="profile_id" className="of-input">
                <option value="">Perfil alvo (opcional)</option>
                {perfis.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome} · {perfil.empresa_nome}
                  </option>
                ))}
              </select>
              <input name="reason" className="of-input md:col-span-2" placeholder="Motivo do acesso assistido" />
              <button type="submit" className="of-btn-primary">Abrir sessão assistida</button>
            </form>
          </article>

          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Sessões assistidas recentes ({sessions.length})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Empresa</th>
                    <th style={TH_STYLE}>Perfil</th>
                    <th style={TH_STYLE}>Motivo</th>
                    <th style={TH_STYLE}>Expira</th>
                    <th style={TH_STYLE}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td style={TD_STYLE}>{session.empresa_nome}</td>
                      <td style={TD_STYLE}>{session.profile_id ?? "—"}</td>
                      <td style={{ ...TD_STYLE, fontSize: "0.8rem" }}>{session.reason}</td>
                      <td style={TD_STYLE}>{fmtDatetime(session.expires_at)}</td>
                      <td style={TD_STYLE}>
                        <span className={session.active && !session.revoked_at ? "of-badge of-badge-green" : "of-badge of-badge-red"}>
                          {session.active && !session.revoked_at ? "Ativa" : "Revogada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhuma sessão assistida registrada.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <form action={encerrarAcessoAssistidoAction} style={{ marginTop: 12 }}>
              <button type="submit" className="of-btn-ghost">Encerrar sessão assistida atual</button>
            </form>
          </article>
        </div>
      )}

      {tab === "limites" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Limites e quotas por tenant</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Empresa</th>
                  <th style={TH_STYLE}>Perfis</th>
                  <th style={TH_STYLE}>Relatórios/dia</th>
                  <th style={TH_STYLE}>Storage MB</th>
                  <th style={TH_STYLE}>SLA h</th>
                  <th style={TH_STYLE}>Notas</th>
                  <th style={TH_STYLE}>Salvar</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => {
                  const override = overrides.find((item) => item.empresa_id === emp.id);
                  const rowFormId = `limits-${emp.id}`;
                  return (
                    <tr key={emp.id}>
                      <td style={TD_STYLE}>{emp.nome}</td>
                      <td style={TD_STYLE}>
                        <input
                          form={rowFormId}
                          name="profile_limit_override"
                          type="number"
                          className="of-input"
                          defaultValue={override?.profile_limit_override ?? ""}
                          placeholder="Perfis"
                        />
                      </td>
                      <td style={TD_STYLE}>
                        <input
                          form={rowFormId}
                          name="report_daily_limit_override"
                          type="number"
                          className="of-input"
                          defaultValue={override?.report_daily_limit_override ?? ""}
                          placeholder="Relatórios/dia"
                        />
                      </td>
                      <td style={TD_STYLE}>
                        <input
                          form={rowFormId}
                          name="storage_limit_mb"
                          type="number"
                          className="of-input"
                          defaultValue={override?.storage_limit_mb ?? ""}
                          placeholder="MB"
                        />
                      </td>
                      <td style={TD_STYLE}>
                        <input
                          form={rowFormId}
                          name="support_sla_hours"
                          type="number"
                          className="of-input"
                          defaultValue={override?.support_sla_hours ?? ""}
                          placeholder="SLA"
                        />
                      </td>
                      <td style={TD_STYLE}>
                        <input
                          form={rowFormId}
                          name="notes"
                          className="of-input"
                          defaultValue={override?.notes ?? ""}
                          placeholder="Notas"
                        />
                      </td>
                      <td style={TD_STYLE}>
                        <form id={rowFormId} action={salvarLimitesEmpresaAction.bind(null, emp.id)}>
                          <button type="submit" className="of-btn-primary">Salvar</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {tab === "flags" && (
        <div style={{ display: "grid", gap: 20 }}>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Feature flags por tenant</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Empresa</th>
                    <th style={TH_STYLE}>Feature</th>
                    <th style={TH_STYLE}>Scope</th>
                    <th style={TH_STYLE}>Estado</th>
                    <th style={TH_STYLE}>Notas</th>
                    <th style={TH_STYLE}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {featureFlags.map((flag) => (
                    <tr key={flag.id}>
                      <td style={TD_STYLE}>{flag.empresa_nome}</td>
                      <td style={TD_STYLE}>{flag.feature_key}</td>
                      <td style={TD_STYLE}>{flag.rollout_scope}</td>
                      <td style={TD_STYLE}>
                        <span className={flag.enabled ? "of-badge of-badge-green" : "of-badge of-badge-red"}>
                          {flag.enabled ? "Ativa" : "Desativada"}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>{flag.notes ?? "—"}</td>
                      <td style={TD_STYLE}>
                        <form action={removerFeatureFlagAction.bind(null, flag.empresa_id)}>
                          <input type="hidden" name="feature_key" value={flag.feature_key} />
                          <button type="submit" className="of-btn-ghost">Remover</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {featureFlags.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhuma flag cadastrada.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>

          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Cadastrar / atualizar flag</div>
            <form className="of-form-grid md:grid-cols-5" action={salvarFeatureFlagAction}>
              <select name="empresa_id" className="of-input" defaultValue="">
                <option value="">Empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              <input name="feature_key" className="of-input" placeholder="feature_key" />
              <input name="rollout_scope" className="of-input" defaultValue="all" placeholder="Scope" />
              <label className="of-empty-text" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input name="enabled" type="checkbox" />
                Ativa
              </label>
              <input name="notes" className="of-input" placeholder="Notas" />
              <button type="submit" className="of-btn-primary">Salvar flag</button>
            </form>
          </article>
        </div>
      )}

      {tab === "comunicacao" && (
        <div style={{ display: "grid", gap: 20 }}>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Enviar comunicado para tenant</div>
            <form action={criarComunicadoTenantAction} className="of-form-grid md:grid-cols-3">
              <select name="empresa_id" className="of-input">
                <option value="">Toda a base / comunicado global</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              <select name="severity" className="of-input" defaultValue="info">
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="error">Crítico</option>
              </select>
              <input name="audience" className="of-input" defaultValue="all" placeholder="Audience" />
              <input name="title" className="of-input md:col-span-3" placeholder="Título do comunicado" />
              <textarea name="message" className="of-input md:col-span-3" placeholder="Mensagem do comunicado" />
              <button type="submit" className="of-btn-primary">Publicar comunicado</button>
            </form>
          </article>

          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Comunicados recentes ({broadcasts.length})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Empresa</th>
                    <th style={TH_STYLE}>Título</th>
                    <th style={TH_STYLE}>Severidade</th>
                    <th style={TH_STYLE}>Audience</th>
                    <th style={TH_STYLE}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((item) => (
                    <tr key={item.id}>
                      <td style={TD_STYLE}>{item.empresa_nome ?? "Global"}</td>
                      <td style={TD_STYLE}>{item.title}</td>
                      <td style={TD_STYLE}>{item.severity}</td>
                      <td style={TD_STYLE}>{item.audience}</td>
                      <td style={TD_STYLE}>{fmtDatetime(item.created_at)}</td>
                    </tr>
                  ))}
                  {broadcasts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhum comunicado registrado.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}

      {tab === "health" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="of-kpi-grid">
            <article className="of-metric-card green">
              <p className="of-kpi-icon">❤️</p>
              <p className="of-kpi-label">API principal</p>
              <p className="of-kpi-value">OK</p>
              <p className="of-metric-change">/api/health</p>
            </article>
            <article className="of-metric-card blue">
              <p className="of-kpi-icon">⚙️</p>
              <p className="of-kpi-label">Health de ops</p>
              <p className="of-kpi-value">OK</p>
              <p className="of-metric-change">/api/health/ops</p>
            </article>
            <article className="of-metric-card yellow">
              <p className="of-kpi-icon">📬</p>
              <p className="of-kpi-label">Filas</p>
              <p className="of-kpi-value">{ticketsAbertos}</p>
              <p className="of-metric-change">tickets abertos para suporte</p>
            </article>
            <article className="of-metric-card purple">
              <p className="of-kpi-icon">💵</p>
              <p className="of-kpi-label">MRR estimado</p>
              <p className="of-kpi-value">R$ {mrrEstimado.toLocaleString("pt-BR")}</p>
              <p className="of-metric-change">carteira total do plano</p>
            </article>
          </div>
          <article className="of-card">
            <div className="of-card-title" style={{ marginBottom: 12 }}>Checklist operacional</div>
            <ul className="of-list">
              <li className="of-list-item">
                <p className="of-list-title">Monitoramento</p>
                <p className="of-list-description">Endpoint de health e fila disponíveis para dashboards externos.</p>
              </li>
              <li className="of-list-item">
                <p className="of-list-title">Billing</p>
                <p className="of-list-description">Assinaturas sincronizadas com Stripe e trilha de auditoria registrada.</p>
              </li>
              <li className="of-list-item">
                <p className="of-list-title">Compliance</p>
                <p className="of-list-description">LGPD, privacidade e retenção já expostos no console e nas rotinas de exportação.</p>
              </li>
            </ul>
          </article>
        </div>
      )}

      {tab === "terminal" && (
        <article className="of-card">
          <div className="of-card-title" style={{ marginBottom: 12 }}>Terminal de Operações (MASTER)</div>
          <p className="of-page-description" style={{ marginBottom: 12 }}>
            Execução real de comandos de suporte TI com auditoria.
          </p>
          <OpsTerminal />
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
                    <th style={TH_STYLE}>Status</th>
                    <th style={TH_STYLE}>Razão</th>
                    <th style={TH_STYLE}>E-mail</th>
                    <th style={TH_STYLE}>IP (hash)</th>
                    <th style={TH_STYLE}>Data</th>
                    <th style={TH_STYLE}>Reparo</th>
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
                      <td style={TD_STYLE}><AlertStatusBadge status={a.status} /></td>
                      <td style={{ ...TD_STYLE, maxWidth: 260, fontSize: "0.8rem" }}>{a.reason}</td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem", color: "var(--of-text-2)" }}>{a.email ?? "—"}</td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontSize: "0.75rem", color: "var(--of-text-3)" }}>
                        {hashShort(a.ip_hash)}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.78rem" }}>
                        {fmtDatetime(a.created_at)}
                        {a.resolved_at ? (
                          <span style={{ display: "block", color: "var(--of-text-3)", fontSize: "0.72rem", marginTop: 2 }}>
                            Resolvido: {fmtDatetime(a.resolved_at)}
                          </span>
                        ) : null}
                      </td>
                      <td style={TD_STYLE}>
                        <form action={atualizarSecurityAlertAction.bind(null, a.id)} style={{ display: "grid", gap: 4 }}>
                          <select name="status" defaultValue={a.status} className="of-input">
                            <option value="open">Aberto</option>
                            <option value="in_progress">Em análise</option>
                            <option value="resolved">Resolvido</option>
                            <option value="ignored">Ignorado</option>
                          </select>
                          <input
                            name="note"
                            defaultValue={a.resolution_note ?? ""}
                            className="of-input"
                            placeholder="Nota técnica do reparo"
                          />
                          <button type="submit" style={BTN_SM}>Salvar</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {alertas.length === 0 && (
                    <tr><td colSpan={8} style={{ ...TD_STYLE, color: "var(--of-text-3)" }}>Nenhum alerta registrado.</td></tr>
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
