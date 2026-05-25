import { createMaterialAction } from "./actions";
import { listMateriais, listPedidosCompra } from "@/lib/db/materiais";
import { listObras } from "@/lib/db/obras";
import { materialIcon } from "@/lib/demo/material-icons";
import { MaterialCardEditor } from "@/components/materiais/material-card-editor";
import { buildMaterialSuggestions } from "@/lib/materials/catalog";
import { MaterialImportButton } from "@/components/materiais/material-import-button";
import { PurchaseOrderModal } from "@/components/materiais/purchase-order-modal";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusMaterial(quantidade: number, mínimo: number) {
  if (quantidade <= mínimo) return "of-badge of-badge-yellow";
  if (quantidade <= mínimo * 1.25) return "of-badge of-badge-blue";
  return "of-badge of-badge-green";
}

function labelMaterial(quantidade: number, mínimo: number) {
  if (quantidade <= mínimo) return "Crítico";
  if (quantidade <= mínimo * 1.25) return "Baixo";
  return "Normal";
}

function pedidoBadge(status: string) {
  if (status === "aprovado") return "of-badge of-badge-green";
  if (status === "rejeitado") return "of-badge of-badge-red";
  if (status === "aguardando" || status === "aguardando_aprovacao") return "of-badge of-badge-yellow";
  return "of-badge of-badge-blue";
}

export default async function MateriaisPage() {
  const [materiais, pedidos, obras] = await Promise.all([listMateriais(), listPedidosCompra(), listObras()]);
  const suggestionsId = "material-suggestions";
  const materialSuggestions = buildMaterialSuggestions(materiais.map((material) => material.nome));

  return (
    <FeatureGateWrapper feature="materiais_basic">
      <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 20, alignItems: "flex-start" }}>
        <p className="of-empty-text">Estoque geral de materiais por obra</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <MaterialImportButton />
          <PurchaseOrderModal
            materiais={materiais.map((material) => ({ id: material.id, nome: material.nome }))}
            obras={obras.map((obra) => ({ id: obra.id, nome: obra.nome }))}
          />
        </div>
      </div>
      <form action={createMaterialAction} className="of-card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid rgba(36,50,79,0.8)",
            background: "linear-gradient(180deg, rgba(255,107,26,0.08), rgba(11,16,32,0))",
          }}
        >
          <div className="of-card-title">Novo material</div>
          <p className="of-empty-text" style={{ marginTop: 6 }}>
            Cadastre rapidamente itens do estoque com quantidade e limite mínimo.
          </p>
        </div>
        <div className="of-form-grid md:grid-cols-5" style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="of-form-label" htmlFor="material-nome">
              Material
            </label>
            <input
              id="material-nome"
              name="nome"
              required
              placeholder="Material"
              list={suggestionsId}
              autoComplete="off"
              className="of-input"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="of-form-label" htmlFor="material-unidade">
              Unidade
            </label>
            <input id="material-unidade" name="unidade" required placeholder="Ex.: kg, m, un" className="of-input" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="of-form-label" htmlFor="material-quantidade">
              Estoque atual
            </label>
            <input id="material-quantidade" name="quantidade" type="number" step="0.01" defaultValue="0" className="of-input" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="of-form-label" htmlFor="material-mínimo">
              Estoque mínimo
            </label>
            <input id="material-mínimo" name="mínimo" type="number" step="0.01" defaultValue="0" className="of-input" />
          </div>
          <button type="submit" className="of-btn-primary" style={{ minHeight: 52, alignSelf: "end" }}>
            + Cadastrar
          </button>
        </div>
      </form>

      <datalist id={suggestionsId}>
        {materialSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      <div className="of-mat-grid">
        {materiais.map((material, index) => {
          const ratio =
            material.mínimo > 0
              ? Math.min(100, Math.round((material.quantidade / (material.mínimo * 2)) * 100))
              : 100;
          const fillColor =
            material.quantidade <= material.mínimo ? "var(--of-red)" : "var(--of-green)";
          return (
            <article key={material.id} className="of-mat-card">
              <p className="of-mat-card-icon">{materialIcon(material.nome, index)}</p>
              <p className="of-mat-name">{material.nome}</p>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                 <div>
                   <p className="of-empty-text" style={{ marginBottom: 4 }}>
                     Estoque
                   </p>
                   <p className="of-mat-qty of-mono">
                     {material.quantidade} {material.unidade}
                   </p>
                 </div>
                 <div>
                   <p className="of-empty-text" style={{ marginBottom: 4 }}>
                     Mínimo
                   </p>
                   <p className="of-mat-qty of-mono">
                     {material.mínimo} {material.unidade}
                   </p>
                 </div>
               </div>
              <span className={statusMaterial(material.quantidade, material.mínimo)}>
                {labelMaterial(material.quantidade, material.mínimo)}
              </span>
              <div className="of-mat-stock-bar">
                <div className="of-mat-stock-fill" style={{ width: `${ratio}%`, background: fillColor }} />
              </div>
              <MaterialCardEditor material={material} suggestionsId={suggestionsId} />
            </article>
          );
        })}
      </div>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Pedidos de Compra Recentes</div>
        <div className="of-table-wrap" style={{ border: 0 }}>
          <table className="of-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Obra</th>
                <th>Fornecedor</th>
                <th>Quantidade</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.material_nome}</td>
                  <td>{pedido.obra_nome}</td>
                  <td>{pedido.fornecedor || "—"}</td>
                  <td className="of-mono">{pedido.quantidade}</td>
                  <td>
                    <span className={pedidoBadge(pedido.status)}>{pedido.status}</span>
                  </td>
                  <td>{money.format(pedido.valor)}</td>
                </tr>
              ))}
              {pedidos.length === 0 ? (
                <tr>
                    <td colSpan={6} className="of-empty-text">
                      Sem pedidos de compra cadastrados.
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
