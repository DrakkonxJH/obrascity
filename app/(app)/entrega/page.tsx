import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { listComissionamento, listEntregas } from "@/lib/db/entrega";
import { listObras } from "@/lib/db/obras";
import { createComissionamentoAction, saveEntregaAction } from "./actions";

export default async function EntregaPage() {
  const [obrasResult, comissionamentosResult, entregasResult] = await Promise.allSettled([
    listObras(),
    listComissionamento(),
    listEntregas(),
  ]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para entrega."), []);
  const comissionamentos =
    comissionamentosResult.status === "fulfilled"
      ? comissionamentosResult.value
      : (warnings.push("Falha ao carregar checklist de comissionamento."), []);
  const entregas =
    entregasResult.status === "fulfilled"
      ? entregasResult.value
      : (warnings.push("Falha ao carregar entregas (verifique migrations)."), []);

  const itensTestados = comissionamentos.filter((item) => item.status === "testado" || item.status === "concluido").length;
  const entregasConcluidas = entregas.filter((item) => item.status === "entregue").length;
  const chavesEntregues = entregas.filter((item) => item.chaves_entregues).length;

  return (
    <FeatureGateWrapper feature="qualidade_basic">
      <section className="of-page">
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card">
            <div className="of-stat-value">{comissionamentos.length}</div>
            <div className="of-stat-label">Itens de comissionamento</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{itensTestados}</div>
            <div className="of-stat-label">Itens testados</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{entregasConcluidas}</div>
            <div className="of-stat-label">Entregas concluídas</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{chavesEntregues}</div>
            <div className="of-stat-label">Chaves entregues</div>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createComissionamentoAction} className="of-card of-form-grid">
            <div className="of-card-title">Comissionamento técnico</div>
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
            <input name="sistema" className="of-input" placeholder="Sistema (elétrica, HVAC...)" required />
            <input name="ambiente" className="of-input" placeholder="Ambiente" required />
            <input name="item" className="of-input" placeholder="Item testado" required />
            <select name="status" className="of-input" defaultValue="pendente">
              <option value="pendente">Pendente</option>
              <option value="testado">Testado</option>
              <option value="concluido">Concluído</option>
              <option value="reprovado">Reprovado</option>
            </select>
            <input name="observacao" className="of-input" placeholder="Observação" />
            <button type="submit" className="of-btn-primary">
              Registrar item
            </button>
          </form>

          <form action={saveEntregaAction} className="of-card of-form-grid">
            <div className="of-card-title">Entrega formal e aceite</div>
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
            <select name="status" className="of-input" defaultValue="preparacao">
              <option value="preparacao">Preparação</option>
              <option value="vistoria">Vistoria</option>
              <option value="entregue">Entregue</option>
            </select>
            <input name="data_entrega" type="date" className="of-input" />
            <label className="of-empty-text" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input name="chaves_entregues" type="checkbox" />
              Chaves entregues ao cliente
            </label>
            <input name="aceite_cliente_nome" className="of-input" placeholder="Nome do responsável pelo aceite" />
            <input name="observacoes" className="of-input" placeholder="Observações de entrega" />
            <button type="submit" className="of-btn-primary">
              Salvar entrega
            </button>
          </form>
        </div>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Checklist de comissionamento</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Sistema</th>
                  <th>Ambiente</th>
                  <th>Item</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {comissionamentos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.sistema}</td>
                    <td>{item.ambiente}</td>
                    <td>{item.item}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
                {comissionamentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="of-empty-text">
                      Sem itens de comissionamento.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Entregas da obra</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Chaves</th>
                  <th>Aceite</th>
                </tr>
              </thead>
              <tbody>
                {entregas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.status}</td>
                    <td>{item.data_entrega ? new Date(item.data_entrega).toLocaleDateString("pt-BR") : "—"}</td>
                    <td>{item.chaves_entregues ? "Sim" : "Não"}</td>
                    <td>{item.aceite_cliente_nome || "—"}</td>
                  </tr>
                ))}
                {entregas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="of-empty-text">
                      Sem entregas registradas.
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
