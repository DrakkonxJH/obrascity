import { FinanceCharts } from "@/components/financeiro/finance-charts";
import { listFinanceiro } from "@/lib/db/financeiro";
import { listObras } from "@/lib/db/obras";
import { createFinanceiroAction } from "./actions";
import { createMedicaoAction } from "./medicoes-actions";
import { getEvmIndicadores, listMedicoes } from "@/lib/db/medicoes";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";

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
  let rows: Awaited<ReturnType<typeof listFinanceiro>> = [];
  let obras: Awaited<ReturnType<typeof listObras>> = [];
  let medicoes: Awaited<ReturnType<typeof listMedicoes>> = [];
  let evm: Awaited<ReturnType<typeof getEvmIndicadores>> = { pv: 0, ev: 0, ac: 0, cpi: 0, spi: 0, eac: 0 };
  let loadError: string | null = null;

  try {
    [rows, obras, medicoes, evm] = await Promise.all([
      listFinanceiro(),
      listObras(),
      listMedicoes(),
      getEvmIndicadores(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar módulo financeiro.";
  }

  const totalOrcado = rows.reduce((acc, row) => acc + row.orcado, 0);
  const totalRealizado = rows.reduce((acc, row) => acc + row.realizado, 0);
  const saldo = totalOrcado - totalRealizado;
  const receitaContratada = medicoes.reduce((acc, item) => acc + item.valor + item.aditivo - item.retencao, 0);

  return (
    <FeatureGateWrapper feature="financeiro_avancado">
      <section className="of-page">
      {loadError ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-red)" }}>
          <p className="of-card-title">Falha ao carregar dados financeiros</p>
          <p className="of-empty-text">{loadError}</p>
        </article>
      ) : null}
      <div className="of-fin-metrics">
        <article className="of-fin-card">
          <p className="of-fin-label">Orçamento Total</p>
          <p className="of-fin-value">{money.format(totalOrcado)}</p>
          <p className="of-fin-sub">{rows.length} lançamentos ativos</p>
        </article>
        <article className="of-fin-card">
          <p className="of-fin-label">Gasto Acumulado</p>
          <p className="of-fin-value warn">{money.format(totalRealizado)}</p>
          <p className="of-fin-sub">Consumo do orçamento em tempo real</p>
        </article>
        <article className="of-fin-card">
          <p className="of-fin-label">Saldo Disponível</p>
          <p className={`of-fin-value ${saldo >= 0 ? "ok" : "risk"}`}>{money.format(saldo)}</p>
          <p className="of-fin-sub">{saldo >= 0 ? "Dentro do planejado" : "Acima do previsto"}</p>
        </article>
        <article className="of-fin-card">
          <p className="of-fin-label">Receita Contratada</p>
          <p className="of-fin-value info">{money.format(receitaContratada)}</p>
          <p className="of-fin-sub">Baseada nas medições registradas</p>
        </article>
      </div>

      <div className="of-table-wrap">
        <table className="of-table">
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

      <div className="of-fin-evm-grid">
        <article className="of-card of-fin-evm-card">
          <p className="of-fin-label">PV · Planned Value</p>
          <p className="of-fin-mini-value">{money.format(evm.pv)}</p>
          <p className="of-fin-sub">Valor planejado acumulado da obra.</p>
        </article>
        <article className="of-card of-fin-evm-card">
          <p className="of-fin-label">EV · AC</p>
          <div className="of-fin-evm-split">
            <div className="of-fin-evm-row">
              <p className="of-fin-evm-row-label">EV (valor agregado)</p>
              <p className="of-fin-evm-row-value">{money.format(evm.ev)}</p>
            </div>
            <div className="of-fin-evm-row">
              <p className="of-fin-evm-row-label">AC (custo real)</p>
              <p className="of-fin-evm-row-value">{money.format(evm.ac)}</p>
            </div>
          </div>
        </article>
        <article className="of-card of-fin-evm-card">
          <p className="of-fin-label">CPI · SPI · EAC</p>
          <div className="of-fin-evm-kpis">
            <div className="of-fin-evm-kpi">
              <p className="of-fin-evm-kpi-label">CPI</p>
              <p className="of-fin-evm-kpi-value">{evm.cpi.toFixed(3)}</p>
            </div>
            <div className="of-fin-evm-kpi">
              <p className="of-fin-evm-kpi-label">SPI</p>
              <p className="of-fin-evm-kpi-value">{evm.spi.toFixed(3)}</p>
            </div>
          </div>
          <p className="of-fin-sub">EAC estimado: {money.format(evm.eac)}</p>
        </article>
      </div>
      </section>
    </FeatureGateWrapper>
  );
}
