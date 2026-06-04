import { PageHeader } from "@/components/ui/page-header";
import { PROFILE_ROLE_OPTIONS } from "@/lib/auth/roles";
import { getTenantSecurityPolicy, listTenantAuthSessions } from "@/lib/db/seguranca-corporativa";
import { revokeTenantSessionAction, saveTenantSecurityPolicyAction } from "./actions";
import Link from "next/link";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/premium-feature-block";

export default async function SegurancaCorporativaPage() {
  const { access } = await getCurrentTenantFeatureAccess("segurança_enterprise");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Segurança Corporativa" status={access} />;
  }

  const [policyResult, sessionsResult] = await Promise.allSettled([
    getTenantSecurityPolicy(),
    listTenantAuthSessions(),
  ]);
  const warnings: string[] = [];
  const policy =
    policyResult.status === "fulfilled"
      ? policyResult.value
      : (warnings.push("Falha ao carregar política de segurança (verifique migrations)."), {
          mfa_required_roles: [],
          sso_enabled: false,
          sso_provider: "",
          sso_entrypoint: "",
          session_timeout_minutes: 43200,
        });
  const sessions =
    sessionsResult.status === "fulfilled"
      ? sessionsResult.value
      : (warnings.push("Falha ao carregar sessões corporativas."), []);

  const mfaResumo = policy.mfa_required_roles.length > 0
    ? `${policy.mfa_required_roles.length} perfil(is) exigindo MFA`
    : "Não configurado";
  const ssoResumo = policy.sso_enabled
    ? `Ativo${policy.sso_provider ? ` · ${policy.sso_provider}` : ""}`
    : "Desativado";
  const timeoutResumo = `${policy.session_timeout_minutes} min`;

  return (
    <section className="of-page">
        <PageHeader
          eyebrow="Sistema"
          title="Segurança corporativa"
          subtitle="Controle SSO, MFA por perfil, timeout de sessão e revogação de dispositivos."
          actions={
            <>
              <Link href="/governanca" className="of-btn-ghost">Governança</Link>
              <Link href="/contas" className="of-btn-primary">Contas</Link>
            </>
          }
        />
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}
        <form action={saveTenantSecurityPolicyAction} className="of-card of-form-grid md:grid-cols-2">
          <div className="of-card-title md:col-span-2">Segurança corporativa</div>
          <label className="of-empty-text" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="sso_enabled" defaultChecked={policy.sso_enabled} />
            Habilitar SSO corporativo (SAML/OIDC)
          </label>
          <input
            name="sso_provider"
            className="of-input"
            defaultValue={policy.sso_provider}
            placeholder="Provedor (AzureAD, Okta, Auth0...)"
          />
          <input
            name="sso_entrypoint"
            className="of-input md:col-span-2"
            defaultValue={policy.sso_entrypoint}
            placeholder="SSO EntryPoint / Issuer URL"
          />
          <div className="md:col-span-2">
            <p className="of-empty-text" style={{ marginBottom: 8 }}>
              Exigir MFA por perfil crítico
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {PROFILE_ROLE_OPTIONS.map((role) => (
                <label key={role} className="of-empty-text" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    name="mfa_roles"
                    value={role}
                    defaultChecked={policy.mfa_required_roles.includes(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
          <input
            name="session_timeout_minutes"
            type="number"
            min={15}
            className="of-input"
            defaultValue={policy.session_timeout_minutes}
            placeholder="Timeout de sessão (minutos)"
          />
          <button type="submit" className="of-btn-primary" style={{ alignSelf: "end" }}>
            Salvar política
          </button>
        </form>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Sessões e dispositivos</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>User-Agent</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.device_label}</td>
                    <td>{session.user_agent}</td>
                    <td>{new Date(session.last_seen_at).toLocaleString("pt-BR")}</td>
                    <td>{session.revoked_at ? "Revogada" : "Ativa"}</td>
                    <td>
                      {session.revoked_at ? null : (
                        <form action={revokeTenantSessionAction}>
                          <input type="hidden" name="session_id" value={session.id} />
                          <button type="submit" className="of-btn-ghost">
                            Revogar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="of-empty-text">
                      Nenhuma sessão registrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Resumo de segurança</div>
          <div className="of-stats-grid">
            <article className="of-stat-card">
              <div className="of-stat-value">{mfaResumo}</div>
              <div className="of-stat-label">MFA</div>
            </article>
            <article className="of-stat-card">
              <div className="of-stat-value">{ssoResumo}</div>
              <div className="of-stat-label">SSO</div>
            </article>
            <article className="of-stat-card">
              <div className="of-stat-value">{timeoutResumo}</div>
              <div className="of-stat-label">Session timeout configurado</div>
            </article>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Alertas de segurança</div>
          <p className="of-empty-text">Nenhum alerta ativo</p>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Registro de auditoria</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Alvo</th>
                  <th>Data</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="of-empty-text">
                    Logs de auditoria centralizados em configuração — em breve.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
  );
}
