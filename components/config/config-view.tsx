"use client";

import { useActionState } from "react";
import { signOut } from "@/lib/auth/actions";
import {
  accessInitialState,
  createPrivacyRequestAction,
  inviteFuncionarioAction,
  privacyInitialState,
  updateFuncionarioRoleAction,
} from "@/app/(app)/configuracoes/actions";
import {
  ASSIGNABLE_PROFILE_ROLE_OPTIONS,
  PROFILE_ROLE_LABEL,
  type ProfileRole,
} from "@/lib/auth/roles";
import type { EquipeItem } from "@/lib/db/equipes";
import type { EmpresaProfileItem } from "@/lib/db/profiles";

type ConfigViewProps = {
  empresaNome: string | null;
  supabaseUrl: string;
  isConnected: boolean;
  userName: string;
  userEmail: string;
  userRole: ProfileRole;
  isMaster: boolean;
  companyProfiles: EmpresaProfileItem[];
  equipes: EquipeItem[];
  privacyRequests: Array<{
    id: string;
    titular_email: string;
    tipo: string;
    status: string;
    observacao: string | null;
    created_at: string;
  }>;
};

export function ConfigView({
  empresaNome,
  supabaseUrl,
  isConnected,
  userName,
  userEmail,
  userRole,
  isMaster,
  companyProfiles,
  equipes,
  privacyRequests,
}: ConfigViewProps) {
  const [privacyState, privacyFormAction, privacyPending] = useActionState(
    createPrivacyRequestAction,
    privacyInitialState,
  );
  const [inviteState, inviteFormAction, invitePending] = useActionState(
    inviteFuncionarioAction,
    accessInitialState,
  );
  const [roleState, roleFormAction, rolePending] = useActionState(
    updateFuncionarioRoleAction,
    accessInitialState,
  );
  const canManageProfiles = userRole === "administrador";

  return (
    <section className="of-page">
      <div className="of-config-grid">
        {isMaster ? (
          <article className="of-config-section">
            <p className="of-config-title">🔗 Integração Supabase</p>
            <p className="of-config-desc">Conecte seu banco de dados para persistência real de dados</p>
            <div className="of-sb-connection-card">
              <span className={`of-sb-dot ${isConnected ? "connected" : "disconnected"}`} />
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {isConnected ? "Conectado (Supabase Live)" : "Desconectado (modo demo)"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--of-text-2)" }}>
                  {supabaseUrl || "Nenhuma URL configurada"}
                </p>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="of-form-label">Supabase URL</label>
              <input className="of-input" readOnly value={supabaseUrl} placeholder="https://xxxx.supabase.co" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="of-form-label">Anon Key</label>
              <input className="of-input" readOnly type="password" value="••••••••••••" placeholder="eyJhbGc..." />
            </div>
            <button type="button" className="of-btn-primary" style={{ width: "100%" }} disabled={!isConnected}>
              Salvar e Conectar
            </button>
          </article>
        ) : null}

        <article className="of-config-section">
          <p className="of-config-title">⚙️ Preferências</p>
          <p className="of-config-desc">Ajustes gerais da plataforma</p>
          {[
            ["Notificações push", "Alertas de atrasos e urgências"],
            ["E-mail de resumo semanal", "Toda segunda-feira, 08h"],
            ["Alertas de estoque crítico", "Quando ≤ 20% do estoque"],
            ["Modo compacto", "Reduz espaçamento dos cards"],
          ].map(([label, sub], i) => (
            <div key={label} className="of-config-row">
              <div>
                <p>{label}</p>
                <small>{sub}</small>
              </div>
              <button type="button" className={`of-toggle ${i < 3 ? "on" : "off"}`} aria-label={label} />
            </div>
          ))}
        </article>

        <article className="of-config-section">
          <p className="of-config-title">👤 Perfil do Usuário</p>
          <p className="of-config-desc">Dados do responsável pela conta</p>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label">Nome completo</label>
            <input className="of-input" defaultValue={userName} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label">E-mail</label>
            <input className="of-input" type="email" defaultValue={userEmail} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label">Empresa</label>
            <input className="of-input" defaultValue={empresaNome ?? "Construtora Demo Ltda."} />
          </div>
          <button type="button" className="of-btn-primary" style={{ width: "100%" }}>
            Salvar Perfil
          </button>
        </article>

        <article className="of-config-section">
          <p className="of-config-title">👥 Gestão de Perfis da Empresa</p>
          <p className="of-config-desc">
            Conta empresarial com criação de acessos individuais para funcionários.
          </p>
          {canManageProfiles ? (
            <form action={inviteFormAction} className="of-form-grid" style={{ gap: 10 }}>
              <input
                name="nome"
                className="of-input"
                placeholder="Nome do funcionário"
                required
              />
              <input
                name="email"
                className="of-input"
                placeholder="E-mail do funcionário"
                type="email"
                required
              />
              <input name="cargo" className="of-input" placeholder="Cargo (ex: Engenheiro Civil)" />
              <select name="role" className="of-input" defaultValue="visualizador" required>
                {ASSIGNABLE_PROFILE_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {PROFILE_ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
              <select name="equipe_id" className="of-input" defaultValue="">
                <option value="">Sem equipe</option>
                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
              <button type="submit" className="of-btn-primary" disabled={invitePending}>
                {invitePending ? "Salvando..." : "Convidar funcionário"}
              </button>
            </form>
          ) : (
            <p className="of-empty-text">Somente perfis administrador podem criar ou editar acessos.</p>
          )}

          {inviteState.message ? (
            <p
              style={{
                marginTop: 10,
                fontSize: "0.85rem",
                color: inviteState.ok ? "var(--of-green)" : "var(--of-red)",
              }}
            >
              {inviteState.message}
            </p>
          ) : null}

          {roleState.message ? (
            <p
              style={{
                marginTop: 10,
                fontSize: "0.85rem",
                color: roleState.ok ? "var(--of-green)" : "var(--of-red)",
              }}
            >
              {roleState.message}
            </p>
          ) : null}

          <div style={{ marginTop: 12 }}>
            <p className="of-form-label" style={{ marginBottom: 8 }}>
              Perfis ativos na empresa
            </p>
            <ul className="of-list">
              {companyProfiles.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">{item.nome}</p>
                  <p className="of-list-description">
                    {item.email} · {item.cargo ?? "Sem cargo definido"} ·{" "}
                    {PROFILE_ROLE_LABEL[item.role]}
                  </p>
                  {canManageProfiles ? (
                    <form action={roleFormAction} className="of-form-grid" style={{ gap: 8, marginTop: 8 }}>
                      <input type="hidden" name="profile_id" value={item.id} />
                      <select
                        name="role"
                        className="of-input"
                        defaultValue={item.role}
                        disabled={rolePending}
                      >
                        {ASSIGNABLE_PROFILE_ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {PROFILE_ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="of-btn-ghost" disabled={rolePending}>
                        {rolePending ? "Atualizando..." : "Atualizar papel"}
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
              {companyProfiles.length === 0 ? (
                <li className="of-empty-text">Nenhum perfil cadastrado nesta empresa.</li>
              ) : null}
            </ul>
          </div>
        </article>

        <article className="of-config-section">
          <p className="of-config-title">🛡️ Segurança e LGPD</p>
          <p className="of-config-desc">Controle de acesso, privacidade e autenticação</p>
          <div className="of-config-row">
            <div>
              <p>Autenticação de dois fatores</p>
              <small>2FA via SMS ou app autenticador</small>
            </div>
            <button type="button" className="of-toggle off" aria-label="2FA" />
          </div>
          <div className="of-config-row">
            <div>
              <p>Sessão automática (30 dias)</p>
              <small>Lembrar login neste dispositivo</small>
            </div>
            <button type="button" className="of-toggle on" aria-label="Sessão" />
          </div>
          <div className="of-config-row">
            <div>
              <p>Auditoria obrigatória</p>
              <small>Logs imutáveis de ações críticas</small>
            </div>
            <button type="button" className="of-toggle on" aria-label="Auditoria" />
          </div>
          <div style={{ marginTop: 18, marginBottom: 12 }}>
            <p className="of-form-label" style={{ marginBottom: 8 }}>
              Direitos LGPD
            </p>
            <form action={privacyFormAction} className="of-form-grid" style={{ gap: 10 }}>
              <select name="tipo" className="of-input" defaultValue="acesso" required>
                <option value="acesso">Solicitar acesso aos meus dados</option>
                <option value="portabilidade">Solicitar portabilidade</option>
                <option value="correcao">Solicitar correção de dados</option>
                <option value="exclusao">Solicitar exclusão/anônimização</option>
              </select>
              <textarea
                name="observacao"
                className="of-input"
                placeholder="Detalhes da solicitação (opcional)"
              />
              <button type="submit" className="of-btn-primary" disabled={privacyPending}>
                {privacyPending ? "Enviando..." : "Registrar solicitação LGPD"}
              </button>
            </form>
            <a href="/api/lgpd/export" className="of-btn-ghost" style={{ display: "inline-block", marginTop: 10 }}>
              Exportar meus dados (JSON)
            </a>
            {privacyState.message ? (
              <p
                style={{
                  marginTop: 10,
                  fontSize: "0.85rem",
                  color: privacyState.ok ? "var(--of-green)" : "var(--of-red)",
                }}
              >
                {privacyState.message}
              </p>
            ) : null}
          </div>
          <div style={{ marginTop: 10 }}>
            <p className="of-form-label" style={{ marginBottom: 8 }}>
              Histórico de solicitações
            </p>
            <ul className="of-list">
              {privacyRequests.map((item) => (
                <li key={item.id} className="of-list-item">
                  <p className="of-list-title">
                    {item.tipo} · {item.status}
                  </p>
                  <p className="of-list-description">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    {item.observacao ? ` · ${item.observacao}` : ""}
                  </p>
                </li>
              ))}
              {privacyRequests.length === 0 ? (
                <li className="of-empty-text">Sem solicitações LGPD registradas.</li>
              ) : null}
            </ul>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="of-form-label">Alterar Senha</label>
            <input className="of-input" type="password" placeholder="Nova senha..." />
          </div>
          <button type="button" className="of-btn-ghost" style={{ width: "100%", marginTop: 12 }}>
            Atualizar Senha
          </button>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--of-border)" }}>
            <form action={signOut}>
              <button type="submit" className="of-btn-red" style={{ width: "100%" }}>
                ↩ Sair da conta
              </button>
            </form>
          </div>
        </article>
      </div>
    </section>
  );
}
