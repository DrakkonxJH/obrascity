import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { listObras } from "@/lib/db/obras";
import { listMudancas } from "@/lib/db/mudancas";
import { createMudancaAction } from "./actions";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function MudancasPage() {
  const [obras, mudancas] = await Promise.all([listObras(), listMudancas()]);

  return (
    <FeatureGateWrapper feature="automacoes_workflow">
      <section className="of-page">
        <form action={createMudancaAction} className="of-card of-form-grid md:grid-cols-3">
          <div className="of-card-title md:col-span-3">Gestão de mudanças (escopo, prazo, custo e contrato)</div>
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
          <select name="tipo" className="of-input" defaultValue="escopo">
            <option value="escopo">Escopo</option>
            <option value="prazo">Prazo</option>
            <option value="custo">Custo</option>
            <option value="contratual">Contratual</option>
          </select>
          <input name="titulo" className="of-input" placeholder="Título da mudança" required />
          <input name="descricao" className="of-input md:col-span-3" placeholder="Descrição detalhada" required />
          <input name="impacto_prazo_dias" type="number" min={0} className="of-input" placeholder="Impacto de prazo (dias)" />
          <input name="impacto_custo" type="number" min={0} step="0.01" className="of-input" placeholder="Impacto de custo" />
          <button type="submit" className="of-btn-primary">
            Abrir solicitação
          </button>
        </form>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Solicitações registradas</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Prazo</th>
                  <th>Custo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mudancas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.tipo}</td>
                    <td>{item.titulo}</td>
                    <td className="of-mono">{item.impacto_prazo_dias} dias</td>
                    <td>{money.format(item.impacto_custo)}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
                {mudancas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">
                      Nenhuma solicitação de mudança registrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </FeatureGateWrapper>
  );
}

