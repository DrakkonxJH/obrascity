import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { PROFILE_ROLE_OPTIONS } from "@/lib/auth/roles";
import { getTenantSecurityPolicy, listTenantAuthSessions } from "@/lib/db/seguranca-corporativa";
import { revokeTenantSessionAction, saveTenantSecurityPolicyAction } from "./actions";

export default async function SegurancaCorporativaPage() {
  const [policy, sessions] = await Promise.all([
    getTenantSecurityPolicy(),
    listTenantAuthSessions(),
  ]);

  return (
    <FeatureGateWrapper feature="segurança_enterprise">
      <section className="of-page">
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
      </section>
    </FeatureGateWrapper>
  );
}

