import Link from "next/link";
import { listObras } from "@/lib/db/obras";
import { listRelatorios } from "@/lib/db/relatorios";
import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { listPortalShares } from "@/lib/db/portal-shares";
import { getAppOrigin } from "@/lib/validations/env";
import { createPortalShareAction, revokePortalShareAction } from "./actions";
import { PageHeader } from "@/components/molecules/page-header";

function getTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("pt-BR") : "—";
}

export default async function PortalPage() {
  const [obras, relatorios, assinatura, shares] = await Promise.all([
    listObras(),
    listRelatorios(),
    getAssinaturaAtual(),
    listPortalShares(),
  ]);
  const appOrigin = getAppOrigin();
  const linksAtivos = shares.filter((share) => share.active);
  const linksComExpiracao = shares.filter((share) => Boolean(share.expires_at)).length;
  const atividadeRecente = [
    ...shares.map((share) => ({
      id: `share-${share.id}`,
      tipo: "link" as const,
      titulo: share.descricao ?? "Link público criado",
      descricao: share.active ? "Compartilhamento externo disponível para clientes." : "Compartilhamento revogado.",
      referencia: share.obra_ids.length > 0 ? `${share.obra_ids.length} obra(s) vinculada(s)` : "Todas as obras",
      data: share.created_at,
    })),
    ...relatorios.map((relatorio) => ({
      id: `report-${relatorio.id}`,
      tipo: "relatorio" as const,
      titulo: `Relatório ${relatorio.tipo}`,
      descricao: `${relatorio.obra_nome ?? "Consolidado"} · ${relatorio.status}`,
      referencia: relatorio.formato.toUpperCase(),
      data: relatorio.created_at,
    })),
  ]
    .sort((a, b) => getTimestamp(b.data) - getTimestamp(a.data))
    .slice(0, 5);

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Sistema"
        title="Portal do cliente"
        subtitle="Compartilhamento externo com token, escopo por obra e trilha de atividade."
        actions={
          <>
            <Link href="/relatorios" className="of-btn-ghost">Relatórios</Link>
            <Link href="/planos" className="of-btn-primary">Planos</Link>
          </>
        }
      />
      <p className="of-empty-text" style={{ marginBottom: 16 }}>
        Portal externo para contratantes (somente leitura), com links públicos segregados por token.
      </p>

      <div className="of-stats-grid" style={{ marginBottom: 20 }}>
        <article className="of-stat-card">
          <div className="of-stat-value">{obras.length}</div>
          <div className="of-stat-label">Obras disponíveis</div>
        </article>
        <article className="of-stat-card">
          <div className="of-stat-value">{relatorios.length}</div>
          <div className="of-stat-label">Relatórios disponíveis</div>
        </article>
        <article className="of-stat-card">
          <div className="of-stat-value">{linksAtivos.length}</div>
          <div className="of-stat-label">Links ativos</div>
        </article>
        <article className="of-stat-card">
          <div className="of-stat-value">{linksComExpiracao}</div>
          <div className="of-stat-label">Links com expiração</div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="of-card">
          <p className="of-list-title">
            Plano atual: <span className="of-badge of-badge-blue">{assinatura?.plano ?? "starter"}</span>
          </p>
          <p className="of-list-description">
            Status: <span className="of-badge of-badge-green">{assinatura?.status ?? "não configurada"}</span>
          </p>
          <p className="of-empty-text" style={{ marginTop: 12 }}>
            Vigência atual: {formatDate(assinatura?.periodo_fim)}
          </p>
          <p className="mt-4">
            <Link href="/planos" className="text-[#ff9445] hover:underline text-sm font-medium">
              Atualizar plano de uso
            </Link>
          </p>
        </article>

        <article className="of-card">
          <div className="of-card-title">Configuração do portal</div>
          <ul className="of-list">
            <li className="of-list-item">
              <p className="of-list-title">Acesso externo</p>
              <p className="of-list-description">Somente leitura para clientes e contratantes, protegido por token.</p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Cobertura de compartilhamento</p>
              <p className="of-list-description">
                {linksAtivos.length > 0 ? `${linksAtivos.length} link(s) ativos no momento.` : "Nenhum link ativo no momento."}
              </p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Política de expiração</p>
              <p className="of-list-description">{linksComExpiracao} link(s) com vencimento configurado.</p>
            </li>
            <li className="of-list-item">
              <p className="of-list-title">Escopo padrão</p>
              <p className="of-list-description">Sem seleção de obra, o link exibe todo o portfólio da empresa.</p>
            </li>
          </ul>
        </article>
      </div>

      <article className="of-card" style={{ marginTop: 16 }}>
        <div className="of-card-title">Compartilhamento externo do portal</div>
        <p className="of-empty-text" style={{ marginBottom: 12 }}>
          Gere links públicos para clientes visualizarem obras e relatórios sem acesso ao painel interno.
        </p>
        <form action={createPortalShareAction} className="of-form-grid md:grid-cols-4">
          <input name="descricao" className="of-input" placeholder="Descrição do link (ex.: Cliente Ponte Rio Verde)" />
          <input name="expires_at" type="date" className="of-input" />
          <select name="obra_ids" className="of-input" multiple size={Math.min(Math.max(obras.length, 2), 6)}>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <button type="submit" className="of-btn-primary">
            Gerar link público
          </button>
        </form>
        <p className="of-empty-text" style={{ marginTop: 8 }}>
          Selecione 1 ou mais obras para restringir o link. Sem seleção = acesso a todas as obras da empresa.
        </p>

        <div className="of-table-wrap" style={{ marginTop: 12, border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Escopo</th>
                <th>Expira em</th>
                <th>Link público</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => {
                const href = `${appOrigin}/portal-public/${share.token}`;
                return (
                  <tr key={share.id}>
                    <td>{share.descricao ?? "Link sem descrição"}</td>
                    <td>
                      {share.obra_ids.length > 0
                        ? `${share.obra_ids.length} obra(s) selecionada(s)`
                        : "Todas as obras"}
                    </td>
                    <td>{share.expires_at ? new Date(share.expires_at).toLocaleDateString("pt-BR") : "Sem expiração"}</td>
                    <td className="of-mono">
                      <a href={href} target="_blank" rel="noreferrer" className="text-[#ff9445] hover:underline">
                        Abrir link
                      </a>
                    </td>
                    <td>
                      <form action={revokePortalShareAction}>
                        <input type="hidden" name="share_id" value={share.id} />
                        <button type="submit" className="of-btn-ghost">
                          Revogar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {shares.length === 0 ? (
                <tr>
                  <td colSpan={5} className="of-empty-text">
                    Nenhum link público gerado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Atividade recente do portal</div>
        {atividadeRecente.length > 0 ? (
          <ul className="of-list">
            {atividadeRecente.map((item) => (
              <li key={item.id} className="of-list-item">
                <p className="of-list-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={item.tipo === "link" ? "of-badge of-badge-blue" : "of-badge of-badge-green"}>
                    {item.tipo === "link" ? "Link" : "Relatório"}
                  </span>
                  {item.titulo}
                </p>
                <p className="of-list-description">
                  {item.descricao} · {item.referencia} · {formatDate(item.data)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="of-empty-text">Nenhuma atividade recente no portal.</p>
        )}
      </article>

      <div className="of-dashboard-grid">
        <article className="of-card">
          <div className="of-card-title">Obras</div>
          <ul className="of-list">
            {obras.map((obra) => (
              <li key={obra.id} className="of-list-item">
                <p className="of-list-title">{obra.nome}</p>
                <p className="of-list-description">
                  Cliente: {obra.cliente} · {obra.status} · {obra.progresso}%
                </p>
              </li>
            ))}
            {obras.length === 0 ? <li className="of-empty-text">Sem obras visíveis.</li> : null}
          </ul>
        </article>

        <article className="of-card">
          <div className="of-card-title">Relatórios disponíveis</div>
          <ul className="of-list">
            {relatorios.map((relatorio) => (
              <li key={relatorio.id} className="of-list-item">
                <p className="of-list-title">{relatorio.tipo}</p>
                <p className="of-list-description">
                  {relatorio.obra_nome ?? "Consolidado"} · {relatorio.status}
                </p>
              </li>
            ))}
            {relatorios.length === 0 ? <li className="of-empty-text">Sem relatórios.</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}
