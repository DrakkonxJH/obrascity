import {
  adjudicarCotacaoAction,
  createCotacaoCompraAction,
  createCotacaoFornecedorAction,
  createCotacaoRodadaAction,
  createMaterialAction,
} from "./actions";
import {
  listContratosFornecedores,
  listCotacaoRodadas,
  listCotacoesCompra,
  listCotacoesFornecedores,
  listMateriais,
  listPedidosCompra,
} from "@/lib/db/materiais";
import { listObras } from "@/lib/db/obras";
import { materialIcon } from "@/lib/demo/material-icons";
import { MaterialCardEditor } from "@/components/organisms/material-card-editor";
import { buildMaterialSuggestions } from "@/lib/materials/catalog";
import { MaterialImportButton } from "@/components/molecules/material-import-button";
import { PurchaseOrderModal } from "@/components/organisms/purchase-order-modal";
import { PageHeader } from "@/components/molecules/page-header";
import Link from "next/link";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/organisms/premium-feature-block";

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
  const { access } = await getCurrentTenantFeatureAccess("materiais_basic");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Materiais" status={access} />;
  }

  const [materiais, pedidos, obras, cotacoes, fornecedores, rodadas, contratos] = await Promise.all([
    listMateriais(),
    listPedidosCompra(),
    listObras(),
    listCotacoesCompra(),
    listCotacoesFornecedores(),
    listCotacaoRodadas(),
    listContratosFornecedores(),
  ]);
  const suggestionsId = "material-suggestions";
  const materialSuggestions = buildMaterialSuggestions(materiais.map((material) => material.nome));

  return (
      <section className="of-page">
      <PageHeader
        eyebrow="Suprimentos"
        title="Materiais e compras"
        subtitle="Estoque geral por obra, cotações multi-fornecedor e pedidos operacionais."
        actions={
          <>
            <Link href="/relatorios/materiais" className="of-btn-ghost">Ver relatório</Link>
            <MaterialImportButton />
            <PurchaseOrderModal
              materiais={materiais.map((material) => ({ id: material.id, nome: material.nome }))}
              obras={obras.map((obra) => ({ id: obra.id, nome: obra.nome }))}
            />
          </>
        }
      />
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
            Cadastrar
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
        <div className="of-table-wrap of-table-wrap--flat of-table-wrap--dense">
          <table className="of-table of-table--dense">
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
                  <td>{pedido.obraNome}</td>
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

      <div className="grid gap-4 lg:grid-cols-2" style={{ marginTop: 20 }}>
        <form action={createCotacaoCompraAction} className="of-card of-form-grid">
          <div className="of-card-title">Cotação multi-fornecedor</div>
          <select name="obra_id" className="of-input" defaultValue="" required>
            <option value="" disabled>
              Obra da cotação
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <select name="material_id" className="of-input" defaultValue="">
            <option value="">Material opcional</option>
            {materiais.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nome}
              </option>
            ))}
          </select>
          <input name="titulo" className="of-input" placeholder="Ex.: Concreto fck 30 para torre A" required />
          <button type="submit" className="of-btn-primary">
            Criar cotação
          </button>
        </form>

        <form action={createCotacaoFornecedorAction} className="of-card of-form-grid">
          <div className="of-card-title">Adicionar proposta de fornecedor</div>
          <select name="cotacao_id" className="of-input" defaultValue="" required>
            <option value="" disabled>
              Cotação
            </option>
            {cotacoes.map((cotacao) => (
              <option key={cotacao.id} value={cotacao.id}>
                {cotacao.titulo}
              </option>
            ))}
          </select>
          <input name="fornecedor" className="of-input" placeholder="Fornecedor" required />
          <div className="of-form-grid md:grid-cols-3">
            <input name="valor_unitario" type="number" min={0} step="0.01" className="of-input" placeholder="Valor unitário" />
            <input name="quantidade" type="number" min={0} step="0.01" className="of-input" placeholder="Quantidade" />
            <input name="prazo_dias" type="number" min={0} className="of-input" placeholder="Prazo (dias)" />
          </div>
          <input name="condicoes" className="of-input" placeholder="Condições comerciais" />
          <button type="submit" className="of-btn-primary">
            Salvar proposta
          </button>
        </form>
      </div>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Cotações em andamento</div>
        <div className="of-table-wrap of-table-wrap--flat of-table-wrap--dense">
          <table className="of-table of-table--dense">
            <thead>
              <tr>
                <th>Título</th>
                <th>Obra</th>
                <th>Material</th>
                <th>Status</th>
                <th>Propostas</th>
              </tr>
            </thead>
            <tbody>
              {cotacoes.map((cotacao) => {
                const propostas = fornecedores.filter((item) => item.cotacao_id === cotacao.id);
                return (
                  <tr key={cotacao.id}>
                    <td>{cotacao.titulo}</td>
                    <td>{cotacao.obraNome}</td>
                    <td>{cotacao.material_nome}</td>
                    <td>{cotacao.status}</td>
                    <td className="of-mono">{propostas.length}</td>
                  </tr>
                );
              })}
              {cotacoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="of-empty-text">
                    Sem cotações cadastradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2" style={{ marginTop: 20 }}>
        <form action={createCotacaoRodadaAction} className="of-card of-form-grid">
          <div className="of-card-title">Rodada de negociação</div>
          <select name="cotacao_id" className="of-input" defaultValue="" required>
            <option value="" disabled>
              Cotação
            </option>
            {cotacoes.map((cotacao) => (
              <option key={cotacao.id} value={cotacao.id}>
                {cotacao.titulo}
              </option>
            ))}
          </select>
          <input name="objetivo" className="of-input" placeholder="Objetivo da rodada" required />
          <input name="observacoes" className="of-input" placeholder="Observações" />
          <button type="submit" className="of-btn-primary">
            Registrar rodada
          </button>
          <p className="of-empty-text">
            Rodadas registradas: <strong>{rodadas.length}</strong>
          </p>
        </form>

        <form action={adjudicarCotacaoAction} className="of-card of-form-grid">
          <div className="of-card-title">Adjudicar e contratar fornecedor</div>
          <select name="cotacao_id" className="of-input" defaultValue="" required>
            <option value="" disabled>
              Cotação vencedora
            </option>
            {cotacoes.map((cotacao) => (
              <option key={cotacao.id} value={cotacao.id}>
                {cotacao.titulo}
              </option>
            ))}
          </select>
          <select name="fornecedor_id" className="of-input" defaultValue="" required>
            <option value="" disabled>
              Fornecedor vencedor
            </option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.fornecedor}
              </option>
            ))}
          </select>
          <select name="status_contrato" className="of-input" defaultValue="rascunho">
            <option value="rascunho">Rascunho</option>
            <option value="assinatura_pendente">Assinatura pendente</option>
            <option value="assinado">Assinado</option>
          </select>
          <input name="condicoes" className="of-input" placeholder="Condições de fechamento" />
          <button type="submit" className="of-btn-primary">
            Adjudicar cotação
          </button>
        </form>
      </div>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Contratos de fornecedores</div>
        <div className="of-table-wrap of-table-wrap--flat of-table-wrap--dense">
          <table className="of-table of-table--dense">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Prazo</th>
                <th>Condições</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => (
                <tr key={contrato.id}>
                  <td>{contrato.obraNome}</td>
                  <td>{contrato.status}</td>
                  <td>{money.format(contrato.valor_total)}</td>
                  <td className="of-mono">{contrato.prazo_dias} dias</td>
                  <td>{contrato.condicoes || "—"}</td>
                </tr>
              ))}
              {contratos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="of-empty-text">
                    Sem contratos registrados.
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
