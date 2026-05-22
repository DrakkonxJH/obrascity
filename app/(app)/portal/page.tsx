import Link from "next/link";
import { listObras } from "@/lib/db/obras";
import { listRelatorios } from "@/lib/db/relatorios";
import { getAssinaturaAtual } from "@/lib/db/assinaturas";

export default async function PortalPage() {
  const [obras, relatórios, assinatura] = await Promise.all([
    listObras(),
    listRelatorios(),
    getAssinaturaAtual(),
  ]);

  return (
    <section className="of-page">
      <p className="of-empty-text" style={{ marginBottom: 16 }}>
        Visão de transparência para contratantes (somente leitura).
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
