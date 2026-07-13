import { getDashboardResumo, listObras } from "@/lib/db/obras";
import { listMembros } from "@/lib/db/equipes";
import { listFinanceiro } from "@/lib/db/financeiro";
import { DashboardView } from "@/components/templates/dashboard-view";

export default async function DashboardPage() {
  let resumo = null;
  let obras: any[] = [];
  let membros: any[] = [];
  let financeiro: any[] = [];
  let loadError: string | null = null;

  try {
    [resumo, obras, membros, financeiro] = await Promise.all([
      getDashboardResumo(),
      listObras(),
      listMembros(),
      listFinanceiro(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar dados do dashboard.";
  }

  const totalOrcado = financeiro.reduce((acc, row) => acc + row.orcado, 0);
  const totalRealizado = financeiro.reduce((acc, row) => acc + row.realizado, 0);
  const mediaProgresso =
    obras.length > 0 ? Math.round(obras.reduce((acc, row) => acc + row.progresso, 0) / obras.length) : 0;

  return (
    <section className="of-page">
      {loadError ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-red)" }}>
          <p className="of-card-title">Falha ao carregar dados do dashboard</p>
          <p className="of-empty-text">{loadError}</p>
        </article>
      ) : null}
      <DashboardView
        resumo={resumo}
        membrosCount={membros.length}
        obras={obras}
        totalOrcado={totalOrcado}
        totalRealizado={totalRealizado}
        mediaProgresso={mediaProgresso}
      />
    </section>
  );
}
