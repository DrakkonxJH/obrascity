import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalShareByToken } from "@/lib/db/portal-shares";

type PortalPublicPageProps = {
  params: Promise<{ token: string }>;
};

export const dynamic = "force-dynamic";

export default async function PortalPublicPage({ params }: PortalPublicPageProps) {
  const { token } = await params;
  const share = await resolvePortalShareByToken(token);
  if (!share) {
    notFound();
  }

  const admin = createAdminClient();
  const scopeObraIds = share.obraIds;
  const obrasQuery = admin
    .from("obras")
    .select("id, nome, cliente, status, progresso")
    .eq("empresa_id", share.empresa_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  const relatoriosQuery = admin
    .from("relatorios")
    .select("id, obra_id, tipo, formato, status, url, storage_bucket, storage_path, obras(nome)")
    .eq("empresa_id", share.empresa_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (scopeObraIds.length > 0) {
    obrasQuery.in("id", scopeObraIds);
    relatoriosQuery.in("obra_id", scopeObraIds);
  }

  const [obrasResult, relatoriosResult, empresaResult] = await Promise.all([
    obrasQuery,
    relatoriosQuery,
    admin.from("empresas").select("nome").eq("id", share.empresa_id).maybeSingle(),
  ]);

  if (obrasResult.error || relatoriosResult.error || empresaResult.error) {
    throw new Error(
      `Falha ao carregar portal público: ${obrasResult.error?.message ?? relatoriosResult.error?.message ?? empresaResult.error?.message}`,
    );
  }

  const obras = obrasResult.data ?? [];
  const relatoriosBase = (relatoriosResult.data ?? []).filter((row) => {
    if (scopeObraIds.length === 0) return true;
    return Boolean(row.obra_id) && scopeObraIds.includes(String(row.obra_id));
  });
  const relatorios = await Promise.all(
    relatoriosBase.map(async (row) => {
      const bucket = typeof row.storage_bucket === "string" ? row.storage_bucket : null;
      const path = typeof row.storage_path === "string" ? row.storage_path : null;
      let signedUrl = typeof row.url === "string" ? row.url : null;
      if (bucket && path) {
        const signed = await admin.storage.from(bucket).createSignedUrl(path, 60 * 10);
        if (!signed.error && signed.data?.signedUrl) {
          signedUrl = signed.data.signedUrl;
        }
      }
      return {
        ...row,
        signedUrl,
      };
    }),
  );
  const empresaNome = empresaResult.data?.nome ?? "Empresa";

  return (
    <section className="of-page" style={{ maxWidth: 1160, margin: "0 auto" }}>
      <article className="of-card" style={{ marginBottom: 16 }}>
        <p className="of-page-title" style={{ marginBottom: 8 }}>
          Portal do Cliente — {empresaNome}
        </p>
        <p className="of-empty-text">
          Acesso externo somente leitura. Este link não permite editar dados.
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
          <div className="of-card-title">Relatórios</div>
          <ul className="of-list">
            {relatorios.map((relatorio) => (
              <li key={relatorio.id} className="of-list-item">
                <p className="of-list-title">
                  {relatorio.tipo} · {(relatorio.formato ?? "pdf").toUpperCase()}
                </p>
                <p className="of-list-description">
                  {((relatorio.obras as { nome?: string } | null)?.nome ?? "Consolidado")} · {relatorio.status}
                </p>
                {relatorio.signedUrl ? (
                  <a href={relatorio.signedUrl} target="_blank" rel="noreferrer" className="text-[#ff9445] hover:underline text-sm">
                    Baixar relatório
                  </a>
                ) : null}
              </li>
            ))}
            {relatorios.length === 0 ? <li className="of-empty-text">Sem relatórios.</li> : null}
          </ul>
        </article>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/" className="of-btn-ghost">
          Voltar para site
        </Link>
      </div>
    </section>
  );
}
