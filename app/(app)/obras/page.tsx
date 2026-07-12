import { listObras, listObrasTrash } from "@/lib/db/obras";
import { listFinanceiro } from "@/lib/db/financeiro";
import { ObrasView } from "@/components/templates/obras-view";

export default async function ObrasPage() {
  const [obras, obrasLixeira, financeiro] = await Promise.all([listObras(), listObrasTrash(), listFinanceiro()]);

  const budgetByObra = new Map<string, { orcado: number; realizado: number }>();
  for (const row of financeiro) {
    const current = budgetByObra.get(row.obra_id) ?? { orcado: 0, realizado: 0 };
    current.orcado += row.orcado;
    current.realizado += row.realizado;
    budgetByObra.set(row.obra_id, current);
  }

  const obrasWithBudget = obras.map((obra) => {
    const fin = budgetByObra.get(obra.id);
    const budgetPct =
      fin && fin.orcado > 0 ? Math.min(100, Math.round((fin.realizado / fin.orcado) * 100)) : obra.progresso;
    return { ...obra, budgetPct };
  });

  return <ObrasView obrasAtivas={obrasWithBudget} obrasLixeira={obrasLixeira} />;
}
