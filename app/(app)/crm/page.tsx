import { CrmBoardTabs } from "@/components/crm/crm-board-tabs";
import { CrmKanban } from "@/components/crm/crm-kanban";
import { listCrmBoards, listCrmDeals } from "@/lib/db/crm";
import { listObras } from "@/lib/db/obras";
import { requireClientProfileForPage } from "@/lib/auth/require-client-account";
import { getCrmMode } from "@/lib/validations/env";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  await requireClientProfileForPage();
  const crmMode = getCrmMode();
  const params = await searchParams;
  const board = String(params.board ?? "geral").trim().toLowerCase() || "geral";

  if (crmMode === "wekan_proxy") {
    return (
      <section className="of-page" style={{ display: "grid", gap: 12 }}>
        <div className="of-inline-header" style={{ marginBottom: 4, alignItems: "center" }}>
          <div>
            <h1 className="of-page-title" style={{ marginBottom: 6 }}>
              ObrasFlow CRM
            </h1>
            <p className="of-empty-text">
              Ambiente CRM integrado via gateway seguro interno.
            </p>
          </div>
        </div>
        <article className="of-card" style={{ padding: 0, overflow: "hidden" }}>
          <iframe
            src="/api/crm/proxy"
            title="ObrasFlow CRM"
            style={{ width: "100%", height: "calc(100vh - 190px)", border: 0, display: "block" }}
          />
        </article>
      </section>
    );
  }

  const [dealsResult, obrasResult, boardsResult] = await Promise.all([
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
    listCrmBoards()
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: unknown) => ({
        data: [],
        error: error instanceof Error ? error.message : "Erro ao carregar quadros CRM",
      })),
  ]);

  const deals = dealsResult.data;
  const obras = obrasResult.data;
  const boards = boardsResult.data;
  const boardTag = `board:${board}`;
  const dealsForBoard =
    board === "geral"
      ? deals.filter((deal) => !deal.tags.some((tag) => tag.startsWith("board:")) || deal.tags.includes(boardTag))
      : deals.filter((deal) => deal.tags.includes(boardTag));

  const missingTablesMessage =
    [dealsResult.error, boardsResult.error]
      .join(" ")
      .toLowerCase()
      .includes("does not exist") ||
    [dealsResult.error, boardsResult.error]
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
            ObrasFlow CRM
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

      <CrmBoardTabs selectedBoard={board} boards={boards} />

      <CrmKanban deals={dealsForBoard} obras={obras} boardSlug={board} />
    </section>
  );
}
