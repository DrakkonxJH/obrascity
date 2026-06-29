import { FinanceCharts } from "@/components/financeiro/finance-charts";
import { listFinanceiro } from "@/lib/db/financeiro";
import { listObras } from "@/lib/db/obras";
import { createFinanceiroAction, createFinanceiroTituloAction, settleFinanceiroTituloAction } from "./actions";
import { createMedicaoAction } from "./medicoes-actions";
import { getEvmIndicadores, listMedicoes } from "@/lib/db/medicoes";
import { listFinanceiroTitulos, listFluxoCaixaMensal } from "@/lib/db/financeiro-corporativo";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/premium-feature-block";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusFinanceiro(consumo: number) {
  if (consumo >= 90) return "of-badge of-badge-yellow";
  if (consumo >= 70) return "of-badge of-badge-blue";
  return "of-badge of-badge-green";
}

function statusLabel(consumo: number) {
  if (consumo >= 90) return "Atenção";
  if (consumo >= 70) return "Monitorar";
  return "Saudável";
}

export default async function FinanceiroPage() {
  const { access } = await getCurrentTenantFeatureAccess("financeiro_avancado");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Financeiro" status={access} />;
  }

  let rows: Awaited<ReturnType<typeof listFinanceiro>> = [];
  let obras: Awaited<ReturnType<typeof listObras>> = [];
  let medicoes: Awaited<ReturnType<typeof listMedicoes>> = [];
  let titulos: Awaited<ReturnType<typeof listFinanceiroTitulos>> = [];
  let fluxoCaixa: Awaited<ReturnType<typeof listFluxoCaixaMensal>> = [];
  let evm: Awaited<ReturnType<typeof getEvmIndicadores>> = { pv: 0, ev: 0, ac: 0, cpi: 0, spi: 0, eac: 0 };
  let loadError: string | null = null;

  try {
    [rows, obras, medicoes, evm, titulos, fluxoCaixa] = await Promise.all([
      listFinanceiro(),
      listObras(),
      listMedicoes(),
      getEvmIndicadores(),
      listFinanceiroTitulos(),
      listFluxoCaixaMensal(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar módulo financeiro.";
  }

  const totalOrcado = rows.reduce((acc, row) => acc + row.orcado, 0);
  const totalRealizado = rows.reduce((acc, row) => acc + row.realizado, 0);
  const saldo = totalOrcado - totalRealizado;
  const receitaContratada = medicoes.reduce((acc, item) => acc + item.valor + item.aditivo - item.retencao, 0);

  return (
      <section className="of-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Controle financeiro da operacao"
        subtitle="Monitore orcamento, fluxo de caixa, medicoes e titulos AP/AR em uma unica visao."
        actions={
          <>
            <Link href="/relatorios/financeiro" className="of-btn-ghost">Ver relatório</Link>
            <Link href="/dashboard" className="of-btn-primary">Voltar ao painel</Link>
          </>
        }
      />
      {loadError ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-red)" }}>
          <p className="of-card-title">Falha ao carregar dados financeiros</p>
          <p className="of-empty-text">{loadError}</p>
        </article>
      ) : null}
      <div className="of-stats-grid" style={{ marginBottom: 20 }}>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Orçamento Total</div>
          <div className="of-kpi-value">{money.format(totalOrcado)}</div>
          <p className="of-empty-text" style={{ fontSize: '0.75rem', marginTop: 4 }}>{rows.length} lançamentos ativos</p>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Gasto Acumulado</div>
          <div className="of-kpi-value warn">{money.format(totalRealizado)}</div>
          <p className="of-empty-text" style={{ fontSize: '0.75rem', marginTop: 4 }}>Consumo do orçamento em tempo real</p>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Saldo Disponível</div>
          <div className={`of-kpi-value ${saldo >= 0 ? "ok" : "risk"}`}>{money.format(saldo)}</div>
          <p className="of-empty-text" style={{ fontSize: '0.75rem', marginTop: 4 }}>{saldo >= 0 ? "Dentro do planejado" : "Acima do previsto"}</p>
        </article>
        <article className="of-kpi-card">
          <div className="of-kpi-label">Receita Contratada</div>
          <div className="of-kpi-value info">{money.format(receitaContratada)}</div>
          <p className="of-empty-text" style={{ fontSize: '0.75rem', marginTop: 4 }}>Baseada nas medições registradas</p>
        </article>
      </div>

      <div className="of-table-wrap of-table-wrap--dense">
        <table className="of-table of-table--dense">
          <thead>
            <tr>
              <th>Obra</th>
              <th>Orçado</th>
              <th>Realizado</th>
              <th>Saldo</th>
              <th>Consumo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const consumo = row.orcado > 0 ? Math.round((row.realizado / row.orcado) * 100) : 0;
              const restante = row.orcado - row.realizado;
              return (
                <tr key={row.id}>
                  <td>{row.obra_nome}</td>
                  <td>{money.format(row.orcado)}</td>
                  <td>{money.format(row.realizado)}</td>
                  <td>{money.format(restante)}</td>
                  <td>
                    <div className="of-consumo-cell">
                      <span>{consumo}%</span>
                      <div className="of-consumo-track">
                        <div className="of-consumo-fill" style={{ width: `${Math.min(100, consumo)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={statusFinanceiro(consumo)}>{statusLabel(consumo)}</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="of-empty-text">
                  Nenhum lançamento financeiro cadastrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <FinanceCharts rows={rows} totalOrcado={totalOrcado} totalRealizado={totalRealizado} />

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={createFinanceiroAction} className="of-card of-form-grid md:grid-cols-5">
          <div className="of-card-title md:col-span-5">Novo lançamento</div>
          <select name="obra_id" required defaultValue="" className="of-input">
            <option value="" disabled>
              Selecione a obra
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <input name="categoria" required placeholder="Categoria" className="of-input" />
          <input name="orcado" type="number" step="0.01" defaultValue="0" className="of-input" />
          <input name="realizado" type="number" step="0.01" defaultValue="0" className="of-input" />
          <button type="submit" className="of-btn-primary">
            Adicionar
          </button>
        </form>

        <form action={createMedicaoAction} className="of-card of-form-grid md:grid-cols-3">
          <div className="of-card-title md:col-span-3">Nova medição</div>
          <select name="obra_id" required defaultValue="" className="of-input">
            <option value="" disabled>
              Obra
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <input name="referencia" required placeholder="Referência" className="of-input" />
          <select name="status" defaultValue="rascunho" className="of-input">
            <option value="rascunho">Rascunho</option>
            <option value="aprovada">Aprovada</option>
            <option value="rejeitada">Rejeitada</option>
          </select>
          <input name="valor" type="number" step="0.01" defaultValue="0" className="of-input" />
          <input name="retencao" type="number" step="0.01" defaultValue="0" className="of-input" />
          <input name="aditivo" type="number" step="0.01" defaultValue="0" className="of-input" />
          <button type="submit" className="of-btn-primary md:col-span-3">
            Registrar medição
          </button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2" style={{ marginTop: 20 }}>
        <form action={createFinanceiroTituloAction} className="of-card of-form-grid md:grid-cols-3">
          <div className="of-card-title md:col-span-3">AP / AR corporativo</div>
          <select name="obra_id" required className="of-input" defaultValue="">
            <option value="" disabled>
              Obra
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <select name="tipo" className="of-input" defaultValue="ap">
            <option value="ap">Conta a pagar (AP)</option>
            <option value="ar">Conta a receber (AR)</option>
          </select>
          <input name="centro_custo" required className="of-input" placeholder="Centro de custo" />
          <input name="descricao" required className="of-input md:col-span-2" placeholder="Descrição do título" />
          <input name="valor" type="number" min={0} step="0.01" className="of-input" placeholder="Valor" />
          <input name="vencimento" type="date" className="of-input" required />
          <button type="submit" className="of-btn-primary">Criar título</button>
        </form>

        <article className="of-card">
          <div className="of-card-title">Projeção mensal de caixa</div>
          <div className="of-table-wrap of-table-wrap--dense of-table-wrap--flat">
            <table className="of-table of-table--dense">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>A pagar</th>
                  <th>A receber</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {fluxoCaixa.map((item) => (
                  <tr key={item.referencia}>
                    <td>{item.referencia}</td>
                    <td>{money.format(item.a_pagar)}</td>
                    <td>{money.format(item.a_receber)}</td>
                    <td className={item.saldo >= 0 ? "of-mono" : "of-mono"}>{money.format(item.saldo)}</td>
                  </tr>
                ))}
                {fluxoCaixa.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="of-empty-text">
                      Sem títulos suficientes para projeção.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Títulos financeiros (AP/AR)</div>
        <div className="of-table-wrap of-table-wrap--dense of-table-wrap--flat">
          <table className="of-table of-table--dense">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Tipo</th>
                <th>Centro de custo</th>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Conciliação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {titulos.map((titulo) => (
                <tr key={titulo.id}>
                  <td>{titulo.obra_nome}</td>
                  <td>{titulo.tipo.toUpperCase()}</td>
                  <td>{titulo.centro_custo}</td>
                  <td>{titulo.descricao}</td>
                  <td>{new Date(titulo.vencimento).toLocaleDateString("pt-BR")}</td>
                  <td>{titulo.status}</td>
                  <td>{money.format(titulo.valor)}</td>
                  <td>{titulo.conciliado ? "Conciliado" : "Pendente"}</td>
                  <td>
                    {titulo.status === "liquidado" || titulo.status === "rejeitado" ? null : (
                      <form action={settleFinanceiroTituloAction} style={{ display: "flex", gap: 8 }}>
                        <input type="hidden" name="titulo_id" value={titulo.id} />
                        <input
                          type="number"
                          name="valor_liquidado"
                          defaultValue={titulo.valor}
                          min={0}
                          step="0.01"
                          className="of-input"
                          style={{ width: 110 }}
                        />
                        <label className="of-empty-text" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input name="conciliado" type="checkbox" defaultChecked={titulo.conciliado} />
                          Conciliar
                        </label>
                        <button type="submit" className="of-btn-ghost">
                          Liquidar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {titulos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="of-empty-text">
                    Nenhum título financeiro registrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <div className="of-stats-grid" style={{ marginTop: 20 }}>
        <article className="of-card">
          <div className="of-card-title">PV · Planned Value</div>
          <div className="of-kpi-value" style={{ fontSize: '1.5rem', marginTop: 8 }}>{money.format(evm.pv)}</div>
          <p className="of-empty-text" style={{ marginTop: 4 }}>Valor planejado acumulado da obra.</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">EV · AC</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="of-empty-text">EV (valor agregado)</span>
              <span className="of-mono" style={{ fontWeight: 700 }}>{money.format(evm.ev)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="of-empty-text">AC (custo real)</span>
              <span className="of-mono" style={{ fontWeight: 700 }}>{money.format(evm.ac)}</span>
            </div>
          </div>
        </article>
        <article className="of-card">
          <div className="of-card-title">CPI · SPI · EAC</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div className="of-kpi-card" style={{ margin: 0 }}>
              <div className="of-kpi-label">CPI</div>
              <div className="of-kpi-value">{evm.cpi.toFixed(3)}</div>
            </div>
            <div className="of-kpi-card" style={{ margin: 0 }}>
              <div className="of-kpi-label">SPI</div>
              <div className="of-kpi-value">{evm.spi.toFixed(3)}</div>
            </div>
          </div>
          <p className="of-empty-text" style={{ marginTop: 8 }}>EAC estimado: {money.format(evm.eac)}</p>
        </article>
      </div>
      </section>
  );
}
