import { CrmBoardTabs } from "@/components/crm/crm-board-tabs";
import { CrmKanban } from "@/components/crm/crm-kanban";
import { listCrmDeals } from "@/lib/db/crm";
import { listObras } from "@/lib/db/obras";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const params = await searchParams;
  const board = String(params.board ?? "geral").trim().toLowerCase() || "geral";

  const [dealsResult, obrasResult] = await Promise.all([
    listCrmDeals()
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar negócios CRM",
      })),
    listObras()
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar obras",
      })),
  ]);

  const deals = dealsResult.data;
  const obras = obrasResult.data;
  const boardTag = `board:${board}`;
  const dealsForBoard =
    board === "geral"
      ? deals.filter((deal) => !deal.tags.some((tag) => tag.startsWith("board:")) || deal.tags.includes(boardTag))
      : deals.filter((deal) => deal.tags.includes(boardTag));

  const missingTablesMessage =
    [dealsResult.error]
      .join(" ")
      .toLowerCase()
      .includes("does not exist") ||
    [dealsResult.error]
      .join(" ")
      .toLowerCase()
      .includes("relation")
      ? "As tabelas do CRM ainda não existem no banco. Execute a migration 0020_crm_module.sql para liberar o módulo completo."
      : null;

  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 16, alignItems: "center" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            CRM de Obras
          </h1>
          <p className="of-empty-text">
            Quadro comercial dinâmico: crie suas próprias abas e organize os cards por etapa.
          </p>
        </div>
      </div>

      {missingTablesMessage ? (
        <article className="of-card" style={{ borderColor: "var(--of-yellow)", marginBottom: 16 }}>
          <p className="of-card-title">CRM aguardando estrutura de banco</p>
          <p className="of-empty-text">{missingTablesMessage}</p>
        </article>
      ) : null}

      <CrmBoardTabs selectedBoard={board} />

      <CrmKanban deals={dealsForBoard} obras={obras} boardSlug={board} />
    </section>
  );
}
