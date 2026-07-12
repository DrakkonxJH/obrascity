import type { FinanceiroItem } from "@/lib/db/financeiro";
import type { ReactNode } from "react";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const compactMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const donutColors = ["#FF6B1A", "#FF9445", "#FFD166", "#22D3EE", "#1FD07A", "#FF4060"];

type FinanceChartsProps = {
  rows: FinanceiroItem[];
  totalOrcado: number;
  totalRealizado: number;
};

export function FinanceCharts({ rows, totalOrcado, totalRealizado }: FinanceChartsProps) {
  const byObra = new Map<string, number>();
  for (const row of rows) {
    byObra.set(row.obraNome, (byObra.get(row.obraNome) ?? 0) + row.realizado);
  }

  const sortedSlices = [...byObra.entries()].sort((a, b) => b[1] - a[1]);
  const topSlices = sortedSlices.slice(0, 4);
  const othersTotal = sortedSlices.slice(4).reduce((acc, [, value]) => acc + value, 0);
  const slices = othersTotal > 0 ? [...topSlices, ["Outras obras", othersTotal] as [string, number]] : topSlices;
  const totalSlice = slices.reduce((acc, [, v]) => acc + v, 0) || 1;
  const legendSlices = slices.map(([label, value]) => ({
    label,
    value,
    percent: Math.round((value / totalSlice) * 100),
  }));
  const chartReference = Math.max(totalOrcado, totalRealizado, 1);
  const chartTicks = [0.75, 0.5, 0.25].map((factor) => compactMoney.format(chartReference * factor));

  const circles = slices.reduce<{ nodes: ReactNode[]; offset: number }>(
    (acc, [label, value], index) => {
      const pct = value / totalSlice;
      const dash = Math.round(pct * 251);
      acc.nodes.push(
        <circle
          key={label}
          cx="55"
          cy="55"
          r="40"
          fill="none"
          stroke={donutColors[index % donutColors.length]}
          strokeWidth="18"
          strokeDasharray={`${dash} ${251 - dash}`}
          strokeDashoffset={acc.offset}
          transform="rotate(-90 55 55)"
        />,
      );
      return { nodes: acc.nodes, offset: acc.offset - dash };
    },
    { nodes: [], offset: 62 },
  ).nodes;

  return (
    <div className="of-fin-chart-wrap">
      <article className="of-card">
        <div className="of-fin-chart-head">
          <div className="of-card-title">Evolução de Gastos — {new Date().getFullYear()}</div>
          <div className="of-fin-line-legend" aria-label="Legenda do gráfico">
            <span className="of-fin-line-legend-item">
              <i className="of-fin-line-solid" aria-hidden /> Realizado
            </span>
            <span className="of-fin-line-legend-item">
              <i className="of-fin-line-dashed" aria-hidden /> Referência orçada
            </span>
          </div>
        </div>
        <svg viewBox="0 0 520 176" width="100%" style={{ display: "block", marginTop: 4 }}>
          <defs>
            <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B1A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF6B1A" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[40, 80, 120].map((y) => (
            <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
          ))}
          {chartTicks.map((tick, index) => (
            <text
              key={tick}
              x="4"
              y={43 + index * 40}
              fill="#4A5A7A"
              fontSize="9"
              fontFamily="DM Mono"
            >
              {tick}
            </text>
          ))}
          <polygon
            points="30,120 90,108 150,96 210,80 270,68 330,52 390,44 450,36 510,28 510,140 30,140"
            fill="rgba(255,107,26,0.08)"
          />
          <polyline
            points="30,120 90,108 150,96 210,80 270,68 330,52 390,44 450,36 510,28"
            fill="none"
            stroke="rgba(255,107,26,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <polygon
            points="30,130 90,125 150,118 210,106 270,95 330,82 390,76 450,70 510,65 510,140 30,140"
            fill="url(#finGrad)"
          />
          <polyline
            points="30,130 90,125 150,118 210,106 270,95 330,82 390,76 450,70 510,65"
            fill="none"
            stroke="#FF6B1A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"].map((m, i) => (
            <text key={m} x={30 + i * 60} y="167" fill="#4A5A7A" fontSize="9" textAnchor="middle" fontFamily="DM Mono">
              {m}
            </text>
          ))}
        </svg>
        <p className="of-empty-text" style={{ marginTop: 8 }}>
          Linha sólida: gasto realizado acumulado no período.
        </p>
      </article>

      <article className="of-card">
        <div className="of-card-title">Distribuição por Obra</div>
        <div className="of-donut-wrap">
          <svg viewBox="0 0 110 110" width="110" style={{ flexShrink: 0 }}>
            <circle cx="55" cy="55" r="40" fill="none" stroke="var(--of-bg-4)" strokeWidth="18" />
            {circles}
            <text x="55" y="52" textAnchor="middle" fill="var(--of-text)" fontSize="13" fontWeight="800" fontFamily="Syne">
              R$
            </text>
            <text x="55" y="66" textAnchor="middle" fill="var(--of-text-2)" fontSize="8" fontFamily="DM Mono">
              {money.format(totalRealizado).replace(/\s/g, "")}
            </text>
          </svg>
          <div className="of-donut-legend">
            {legendSlices.map(({ label, value, percent }, index) => (
              <div key={label} className="of-donut-legend-item">
                <span className="of-donut-legend-dot" style={{ background: donutColors[index % donutColors.length] }} />
                <span className="of-donut-legend-texts">
                  <span className="of-donut-legend-label" title={label}>
                    {label}
                  </span>
                  <span className="of-donut-legend-sub">{percent}%</span>
                </span>
                <span className="of-donut-legend-val">{money.format(value)}</span>
              </div>
            ))}
            {slices.length === 0 ? <p className="of-empty-text">Sem dados para distribuição.</p> : null}
          </div>
          <p className="of-empty-text of-donut-total">
            Orçado total: {money.format(totalOrcado)}
          </p>
        </div>
        <p className="of-empty-text" style={{ marginTop: 10 }}>
          Total realizado: {compactMoney.format(totalRealizado)}
        </p>
      </article>
    </div>
  );
}
