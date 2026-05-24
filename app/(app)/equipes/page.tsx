import { createEquipeAction } from "./actions";
import { listEquipes, listMembros } from "@/lib/db/equipes";
import { EquipesView } from "@/components/equipes/equipes-view";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";

export default async function EquipesPage() {
  const [equipes, membros] = await Promise.all([listEquipes(), listMembros()]);

  const formSlot = (
    <form action={createEquipeAction} className="of-card of-form-grid md:grid-cols-3" style={{ marginBottom: 20 }}>
      <div className="of-card-title md:col-span-3">Cadastrar equipe</div>
      <input name="nome" required placeholder="Nome da equipe" className="of-input" />
      <input name="especialidade" placeholder="Especialidade" className="of-input" />
      <button type="submit" className="of-btn-primary">
        + Cadastrar equipe
      </button>
    </form>
  );

  return (
    <FeatureGateWrapper feature="equipes_basic">
      <EquipesView equipes={equipes} membros={membros} formSlot={formSlot} />
    </FeatureGateWrapper>
  );
}
