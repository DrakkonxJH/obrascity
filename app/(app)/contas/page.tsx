import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { PROFILE_ROLE_LABEL, isProfileRole } from "@/lib/auth/roles";
import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { listMateriais } from "@/lib/db/materiais";
import { listNotificacoes } from "@/lib/db/notificacoes";
import { listObras } from "@/lib/db/obras";
import { listEmpresaProfiles } from "@/lib/db/profiles";
import { getProfileLimitByPlan } from "@/lib/billing/plans";

const MANAGEMENT_ROLES = new Set(["administrador", "gestor"]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function getHealthLabel(usagePercent: number) {
  if (usagePercent >= 90) return { text: "Crítico", color: "var(--of-red)" };
  if (usagePercent >= 70) return { text: "Atenção", color: "var(--of-yellow)" };
  return { text: "Saudável", color: "var(--of-green)" };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

export default async function ContasPage() {
  const [profile, assinatura, perfis, obras, materiais, notificacoes] = await Promise.all([
    getCurrentProfile(),
    getAssinaturaAtual(),
    listEmpresaProfiles(),
    listObras(),
    listMateriais(),
    listNotificacoes(120),
  ]);

  const userRole = String(profile?.role ?? "");
  const canManage = MANAGEMENT_ROLES.has(userRole);
  const plan = assinatura?.plano ?? "trial";
  const profileLimit = getProfileLimitByPlan(plan);
  const profileUsagePercent = toPercent(perfis.length, profileLimit);
  const materialAlerts = materiais.filter((item) => item.quantidade <= item.mínimo).length;

  const estimatedMemoryMb = Math.round(
    perfis.length * 2.2 + obras.length * 4 + materiais.length * 0.8 + notificacoes.length * 0.15,
  );
  const memoryLimitMb = plan === "enterprise" ? 2048 : plan === "pro" ? 1024 : 512;
  const memoryUsagePercent = toPercent(estimatedMemoryMb, memoryLimitMb);

  const profileHealth = getHealthLabel(profileUsagePercent);
  const memoryHealth = getHealthLabel(memoryUsagePercent);
  const subscriptionActive = ACTIVE_SUBSCRIPTION_STATUSES.has(String(assinatura?.status ?? ""));

  return (
    <section className="of-page" style={{ display: "grid", gap: 16 }}>
      <div className="of-inline-header">
        <div>
          <h1 className="of-page-title">Gerenciamento de Contas</h1>
          <p className="of-page-description">
            Assinaturas, usuários, consumo operacional e ações administrativas em um único painel.
          </p>
        </div>
      </div>

      {!canManage ? (
        <article className="of-card" style={{ borderLeft: "4px solid var(--of-yellow)" }}>
          <p className="of-card-title">Acesso restrito</p>
          <p className="of-empty-text">
            Apenas Administrador ou Gestor podem gerenciar contas e assinaturas. Seu papel atual é{" "}
            <strong>{isProfileRole(userRole) ? PROFILE_ROLE_LABEL[userRole] : "Visualizador"}</strong>.
          </p>
          <Link href="/configuracoes" className="of-btn-ghost" style={{ display: "inline-block", marginTop: 12 }}>
            Solicitar ajuste de acesso
          </Link>
        </article>
      ) : (
        <>
          <div className="of-kpi-grid">
            <article className="of-metric-card blue">
              <p className="of-kpi-icon">👥</p>
              <p className="of-kpi-label">Contas ativas</p>
              <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>
                {perfis.length}
              </p>
              <p className="of-metric-change">
                {profileLimit} no plano atual · {profileUsagePercent}% utilizado
              </p>
            </article>
            <article className="of-metric-card green">
              <p className="of-kpi-icon">⭐</p>
              <p className="of-kpi-label">Assinatura</p>
              <p className="of-kpi-value" style={{ color: subscriptionActive ? "var(--of-green)" : "var(--of-red)" }}>
                {subscriptionActive ? "Ativa" : "Atenção"}
              </p>
              <p className="of-metric-change">
                Plano {plan.toUpperCase()} · Status {assinatura?.status ?? "trial"}
              </p>
            </article>
            <article className="of-metric-card yellow">
              <p className="of-kpi-icon">🧠</p>
              <p className="of-kpi-label">Consumo de memória</p>
              <p className="of-kpi-value" style={{ color: memoryHealth.color }}>
                {memoryUsagePercent}%
              </p>
              <p className="of-metric-change">
                {estimatedMemoryMb} MB de {memoryLimitMb} MB (estimado por carga de dados)
              </p>
            </article>
            <article className="of-metric-card purple">
              <p className="of-kpi-icon">🛟</p>
              <p className="of-kpi-label">Funcionamento</p>
              <p className="of-kpi-value" style={{ color: profileHealth.color }}>
                {profileHealth.text}
              </p>
              <p className="of-metric-change">
                {materialAlerts} alertas de estoque · {notificacoes.filter((n) => !n.lida).length} notificações não lidas
              </p>
            </article>
          </div>

          <div className="of-dashboard-grid">
            <article className="of-card">
              <div className="of-card-title">Controle de assinatura e cobrança</div>
              <div className="of-list">
                <div className="of-list-item">
                  <p className="of-list-title">Plano atual</p>
                  <p className="of-list-description">{plan.toUpperCase()}</p>
                </div>
                <div className="of-list-item">
                  <p className="of-list-title">Status da assinatura</p>
                  <p className="of-list-description">{assinatura?.status ?? "trial"}</p>
                </div>
                <div className="of-list-item">
                  <p className="of-list-title">Próximo vencimento</p>
                  <p className="of-list-description">
                    {assinatura?.periodo_fim ? formatDate(assinatura.periodo_fim) : "Não informado"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link href="/planos" className="of-btn-primary">
                  Administrar assinatura
                </Link>
                <Link href="/suporte" className="of-btn-ghost">
                  Solicitar reset financeiro
                </Link>
              </div>
            </article>

            <article className="of-card">
              <div className="of-card-title">Estado operacional</div>
              <ul className="of-activity-list">
                <li className="of-activity-item">
                  <span className="of-activity-dot" style={{ background: subscriptionActive ? "var(--of-green)" : "var(--of-red)" }} />
                  <div>
                    <p className="of-activity-title">Assinatura {subscriptionActive ? "válida" : "requer atenção"}</p>
                    <p className="of-activity-description">status: {assinatura?.status ?? "trial"}</p>
                  </div>
                </li>
                <li className="of-activity-item">
                  <span className="of-activity-dot" style={{ background: profileHealth.color }} />
                  <div>
                    <p className="of-activity-title">Uso de contas: {profileHealth.text}</p>
                    <p className="of-activity-description">
                      {perfis.length}/{profileLimit} contas cadastradas
                    </p>
                  </div>
                </li>
                <li className="of-activity-item">
                  <span className="of-activity-dot" style={{ background: memoryHealth.color }} />
                  <div>
                    <p className="of-activity-title">Memória operacional: {memoryHealth.text}</p>
                    <p className="of-activity-description">
                      {estimatedMemoryMb} MB estimados de {memoryLimitMb} MB
                    </p>
                  </div>
                </li>
              </ul>
            </article>
          </div>

          <article className="of-card">
            <div className="of-card-title">Usuários da empresa</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--of-border)" }}>
                    <th style={{ textAlign: "left", padding: "10px 6px" }}>Nome</th>
                    <th style={{ textAlign: "left", padding: "10px 6px" }}>E-mail</th>
                    <th style={{ textAlign: "left", padding: "10px 6px" }}>Papel</th>
                    <th style={{ textAlign: "left", padding: "10px 6px" }}>Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {perfis.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--of-border)" }}>
                      <td style={{ padding: "10px 6px" }}>{item.nome}</td>
                      <td style={{ padding: "10px 6px" }}>{item.email}</td>
                      <td style={{ padding: "10px 6px" }}>
                        {isProfileRole(item.role) ? PROFILE_ROLE_LABEL[item.role] : "Visualizador"}
                      </td>
                      <td style={{ padding: "10px 6px" }}>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                  {perfis.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "12px 6px", color: "var(--of-text-2)" }}>
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/configuracoes" className="of-btn-ghost">
                Gerenciar perfis e permissões
              </Link>
              <Link href="/suporte" className="of-btn-red">
                Solicitar reset de conta
              </Link>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
