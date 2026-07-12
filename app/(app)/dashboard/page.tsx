import { getDashboardResumo, listObras } from "@/lib/db/obras";
import { listMembros } from "@/lib/db/equipes";
import { listFinanceiro } from "@/lib/db/financeiro";
import { DashboardView } from "@/components/templates/dashboard-view";

export default async function DashboardPage() {
  const [resumo, obras, membros, financeiro] = await Promise.all([
    getDashboardResumo(),
    listObras(),
    listMembros(),
    listFinanceiro(),
  ]);

  const totalOrcado = financeiro.reduce((acc, row) => acc + row.orcado, 0);
  const totalRealizado = financeiro.reduce((acc, row) => acc + row.realizado, 0);
  const mediaProgresso =
    obras.length > 0 ? Math.round(obras.reduce((acc, row) => acc + row.progresso, 0) / obras.length) : 0;

  return (
    <DashboardView
      resumo={resumo}
      membrosCount={membros.length}
      obras={obras}
      totalOrcado={totalOrcado}
      totalRealizado={totalRealizado}
      mediaProgresso={mediaProgresso}
    />
  );
}
