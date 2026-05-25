import Link from "next/link";
import { listObras } from "@/lib/db/obras";
import { listRelatorios } from "@/lib/db/relatorios";
import { getAssinaturaAtual } from "@/lib/db/assinaturas";
import { listPortalShares } from "@/lib/db/portal-shares";
import { getAppOrigin } from "@/lib/validations/env";
import { createPortalShareAction, revokePortalShareAction } from "./actions";

export default async function PortalPage() {
  const [obras, relatórios, assinatura, shares] = await Promise.all([
    listObras(),
    listRelatorios(),
    getAssinaturaAtual(),
    listPortalShares(),
  ]);
  const appOrigin = getAppOrigin();

  return (
    <section className="of-page">
      <p className="of-empty-text" style={{ marginBottom: 16 }}>
        Portal externo para contratantes (somente leitura), com links públicos segregados por token.
      </p>

      <article className="of-card">
        <p className="of-list-title">
          Plano atual: <span className="of-badge of-badge-blue">{assinatura?.plano ?? "starter"}</span>
        </p>
        <p className="of-list-description">
          Status: <span className="of-badge of-badge-green">{assinatura?.status ?? "não configurada"}</span>
        </p>
        <p className="mt-4">
          <Link href="/planos" className="text-[#ff9445] hover:underline text-sm font-medium">
            Atualizar plano de uso
          </Link>
        </p>
      </article>

      <article className="of-card" style={{ marginTop: 16 }}>
        <div className="of-card-title">Compartilhamento externo do portal</div>
        <p className="of-empty-text" style={{ marginBottom: 12 }}>
          Gere links públicos para clientes visualizarem obras e relatórios sem acesso ao painel interno.
        </p>
        <form action={createPortalShareAction} className="of-form-grid md:grid-cols-3">
          <input name="descricao" className="of-input" placeholder="Descrição do link (ex.: Cliente Ponte Rio Verde)" />
          <input name="expires_at" type="date" className="of-input" />
          <button type="submit" className="of-btn-primary">
            Gerar link público
          </button>
        </form>

        <div className="of-table-wrap" style={{ marginTop: 12, border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Descrição</th>
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
                  <td colSpan={4} className="of-empty-text">
                    Nenhum link público gerado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
            {relatórios.map((relatório) => (
              <li key={relatório.id} className="of-list-item">
                <p className="of-list-title">{relatório.tipo}</p>
                <p className="of-list-description">
                  {relatório.obra_nome ?? "Consolidado"} · {relatório.status}
                </p>
              </li>
            ))}
            {relatórios.length === 0 ? <li className="of-empty-text">Sem relatórios.</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}
