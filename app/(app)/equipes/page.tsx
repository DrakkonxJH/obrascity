import { createEquipeAction, createEquipeAlocacaoAction } from "./actions";
import { listEquipes, listMembros } from "@/lib/db/equipes";
import { EquipesView } from "@/components/templates/equipes-view";
import { listObras } from "@/lib/db/obras";
import { listEquipeAlocacoes, listEquipeCapacidade } from "@/lib/db/mobilizacao";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/organisms/premium-feature-block";

export default async function EquipesPage() {
  const { access } = await getCurrentTenantFeatureAccess("equipes_basic");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Equipes" status={access} />;
  }

  let equipes: any[] = [];
  let membros: any[] = [];
  let obras: any[] = [];
  let alocacoes: any[] = [];
  let capacidade: any[] = [];
  let loadError: string | null = null;

  try {
    [equipes, membros, obras, alocacoes, capacidade] = await Promise.all([
      listEquipes(),
      listMembros(),
      listObras(),
      listEquipeAlocacoes(),
      listEquipeCapacidade(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar dados de equipes.";
  }

  const formSlot = (
    <form action={createEquipeAction} className="of-card of-form-grid md:grid-cols-3" style={{ marginBottom: 20 }}>
      <div className="of-card-title md:col-span-3">Cadastrar equipe</div>
      <input name="nome" required placeholder="Nome da equipe" className="of-input" />
      <input name="especialidade" placeholder="Especialidade" className="of-input" />
      <button type="submit" className="of-btn-primary">
        Cadastrar equipe
      </button>
    </form>
  );

  return (
    <section className="of-page">
      {loadError ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-red)" }}>
          <p className="of-card-title">Falha ao carregar dados de equipes</p>
          <p className="of-empty-text">{loadError}</p>
        </article>
      ) : null}
      <EquipesView equipes={equipes} membros={membros} formSlot={formSlot} />

        <div className="grid gap-4 lg:grid-cols-2" style={{ marginTop: 20 }}>
          <form action={createEquipeAlocacaoAction} className="of-card of-form-grid">
            <div className="of-card-title">Alocação operacional por frente e turno</div>
            <select name="obra_id" className="of-input" defaultValue="" required>
              <option value="" disabled>
                Obra
              </option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </select>
            <select name="equipe_id" className="of-input" defaultValue="" required>
              <option value="" disabled>
                Equipe
              </option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
            <input name="frente" className="of-input" placeholder="Frente de serviço" required />
            <select name="turno" className="of-input" defaultValue="diurno">
              <option value="diurno">Diurno</option>
              <option value="noturno">Noturno</option>
              <option value="misto">Misto</option>
            </select>
            <div className="of-form-grid md:grid-cols-2">
              <input name="data_inicio" type="date" className="of-input" required />
              <input name="data_fim" type="date" className="of-input" required />
            </div>
            <div className="of-form-grid md:grid-cols-2">
              <input name="capacidade_planejada" type="number" min={0} className="of-input" placeholder="Capacidade" />
              <input name="alocados" type="number" min={0} className="of-input" placeholder="Alocados" />
            </div>
            <select name="status" className="of-input" defaultValue="planejada">
              <option value="planejada">Planejada</option>
              <option value="ativa">Ativa</option>
              <option value="finalizada">Finalizada</option>
            </select>
            <input name="observacoes" className="of-input" placeholder="Observações" />
            <button type="submit" className="of-btn-primary">
              Registrar alocação
            </button>
          </form>

          <article className="of-card">
            <div className="of-card-title">Capacidade e conflitos</div>
            <div className="of-table-wrap" style={{ border: 0 }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>Equipe</th>
                    <th>Capacidade</th>
                    <th>Alocados</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {capacidade.map((item) => (
                    <tr key={item.equipeId}>
                      <td>{item.equipeNome}</td>
                      <td className="of-mono">{item.capacidadeTotal}</td>
                      <td className="of-mono">{item.alocadosTotal}</td>
                      <td>
                        <span className={`of-badge ${item.conflito ? "of-badge-red" : "of-badge-green"}`}>
                          {item.conflito ? "Conflito" : "OK"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {capacidade.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="of-empty-text">
                        Sem dados de capacidade.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Agenda de alocação</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Equipe</th>
                  <th>Frente</th>
                  <th>Turno</th>
                  <th>Período</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alocacoes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obraNome}</td>
                    <td>{item.equipeNome}</td>
                    <td>{item.frente}</td>
                    <td>{item.turno}</td>
                    <td>
                      {new Date(item.dataInicio).toLocaleDateString("pt-BR")} - {new Date(item.dataFim).toLocaleDateString("pt-BR")}
                    </td>
                    <td>{item.status}</td>
                  </tr>
                ))}
                {alocacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">
                      Sem alocações registradas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
  );
}
