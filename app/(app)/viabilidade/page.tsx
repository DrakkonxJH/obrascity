import type { ReactNode } from "react";
import { listObras } from "@/lib/db/obras";
import { listViabilidade } from "@/lib/db/viabilidade";
import { saveViabilidadeAction } from "./actions";
import { RiskMatrix } from "./risk-matrix";
import { PageHeader } from "@/components/molecules/page-header";
import Link from "next/link";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/organisms/premium-feature-block";

type StatusField = "status_tecnico" | "status_legal" | "status_economico";

type ResumoStatus = {
  aprovados: number;
  restricoes: number;
  pendentes: number;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const detailsStyle = {
  background: "var(--of-bg-3)",
  border: "1px solid var(--of-border)",
  borderRadius: 10,
  padding: 0,
  marginTop: 12,
} as const;

const summaryStyle = {
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
  color: "var(--of-text)",
  listStyle: "none",
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderBottom: "1px solid var(--of-border)",
} as const;

const detailGridStyle = {
  padding: "16px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
} as const;

function FormField({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...(fullWidth ? { gridColumn: "1 / -1" } : {}) }}>
      <span style={{ fontSize: "0.84rem", color: "var(--of-text-2)", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open style={detailsStyle}>
      <summary style={summaryStyle}>{title}</summary>
      <div style={detailGridStyle}>{children}</div>
    </details>
  );
}

function statusBadge(status: string) {
  if (status === "ok") {
    return <span className="of-badge of-badge-green">Aprovado</span>;
  }
  if (status === "restricao") {
    return <span className="of-badge of-badge-yellow">Restrição</span>;
  }
  return <span className="of-badge">Pendente</span>;
}

function goNoGoBadge(value: string) {
  if (value === "go") {
    return (
      <span className="of-badge of-badge-green" style={{ fontWeight: 800, fontSize: "0.9rem" }}>
        GO
      </span>
    );
  }
  if (value === "no_go") {
    return (
      <span className="of-badge of-badge-red" style={{ fontWeight: 800 }}>
        NO-GO
      </span>
    );
  }
  return <span className="of-badge of-badge-yellow">Em análise</span>;
}

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${percentFormatter.format(value)}%`;
}

function formatPayback(value: number | null) {
  return value === null ? "—" : `${Math.round(value)} meses`;
}

function formatUpdatedAt(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function ViabilidadePage() {
  const { access } = await getCurrentTenantFeatureAccess("obras_basic");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Viabilidade" status={access} />;
  }

  const [obrasResult, estudosResult] = await Promise.allSettled([listObras(), listViabilidade()]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para viabilidade."), []);
  const estudos =
    estudosResult.status === "fulfilled"
      ? estudosResult.value
      : (warnings.push("Falha ao carregar estudos de viabilidade."), []);
  const obraNomeById = new Map(obras.map((obra) => [obra.id, obra.nome]));
  const estudosComObraNome = estudos.map((item) => ({
    ...item,
    obra_nome: obraNomeById.get(item.obraId) ?? "Obra sem identificação",
  }));

  const totalEstudos = estudosComObraNome.length;
  const goAprovados = estudosComObraNome.filter((item) => item.go_no_go === "go").length;
  const noGos = estudosComObraNome.filter((item) => item.go_no_go === "no_go").length;
  const pendentes = estudosComObraNome.filter((item) => item.go_no_go === "pendente").length;
  const goPct = totalEstudos ? (goAprovados / totalEstudos) * 100 : 0;
  const noGoPct = totalEstudos ? (noGos / totalEstudos) * 100 : 0;
  const pendPct = totalEstudos ? (pendentes / totalEstudos) * 100 : 0;

  const investimentos = estudosComObraNome.flatMap((item) => (item.valor_investimento === null ? [] : [item.valor_investimento]));
  const receitas = estudosComObraNome.flatMap((item) => (item.receita_esperada === null ? [] : [item.receita_esperada]));
  const rois = estudosComObraNome.flatMap((item) => (item.roi_percent === null ? [] : [item.roi_percent]));
  const paybacks = estudosComObraNome.flatMap((item) => (item.payback_meses === null ? [] : [item.payback_meses]));

  const investimentoTotal = investimentos.length ? investimentos.reduce((total, value) => total + value, 0) : null;
  const receitaTotal = receitas.length ? receitas.reduce((total, value) => total + value, 0) : null;
  const roiMedio = rois.length ? rois.reduce((total, value) => total + value, 0) / rois.length : null;
  const paybackMedio = paybacks.length ? paybacks.reduce((total, value) => total + value, 0) / paybacks.length : null;

  const getResumoStatus = (field: StatusField): ResumoStatus => ({
    aprovados: estudosComObraNome.filter((item) => item[field] === "ok").length,
    restricoes: estudosComObraNome.filter((item) => item[field] === "restricao").length,
    pendentes: estudosComObraNome.filter((item) => item[field] === "pendente").length,
  });

  const resumoTecnico = getResumoStatus("status_tecnico");
  const resumoLegal = getResumoStatus("status_legal");
  const resumoEconomico = getResumoStatus("status_economico");

  return (
      <section className="of-page">
        <PageHeader
          eyebrow="Viabilidade"
          title="Estudos de viabilidade"
          subtitle="Análise técnica, legal e econômico-financeira dos empreendimentos."
          actions={
            <>
              <Link href="/projetos" className="of-btn-ghost">Projetos</Link>
              <Link href="/relatorios/viabilidade" className="of-btn-primary">Relatório</Link>
            </>
          }
        />

        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          {[
            { value: totalEstudos, label: "Total de estudos" },
            { value: goAprovados, label: "GO aprovados" },
            { value: noGos, label: "NO-GO" },
            { value: pendentes, label: "Em análise" },
          ].map((item) => (
            <article key={item.label} className="of-kpi-card">
              <div className="of-kpi-label">{item.label}</div>
              <div className="of-kpi-value">{item.value}</div>
            </article>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Investimento total estimado", value: formatCurrency(investimentoTotal), accent: "var(--of-blue)" },
            { label: "Receita esperada total", value: formatCurrency(receitaTotal), accent: "var(--of-green)" },
            { label: "ROI médio", value: formatPercent(roiMedio), accent: "var(--of-purple)" },
            { label: "Payback médio", value: formatPayback(paybackMedio), accent: "var(--of-yellow)" },
          ].map((item) => (
            <article key={item.label} className="of-card" style={{ position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(135deg, ${item.accent}18, transparent 65%)`,
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative" }}>
                <div className="of-stat-label" style={{ marginBottom: 6 }}>
                  {item.label}
                </div>
                <div className="of-stat-value" style={{ fontSize: "1.5rem" }}>
                  {item.value}
                </div>
              </div>
            </article>
          ))}
        </div>

        <article className="of-card" style={{ marginBottom: 20 }}>
          <div className="of-card-title">Sinalizador GO / NO-GO</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "GO", value: goAprovados, color: "var(--of-green)", text: `${Math.round(goPct)}%` },
                { label: "NO-GO", value: noGos, color: "var(--of-red)", text: `${Math.round(noGoPct)}%` },
                { label: "Pendente", value: pendentes, color: "var(--of-text-3)", text: `${Math.round(pendPct)}%` },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      background: `${item.color}20`,
                      border: `1px solid ${item.color}55`,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                  <div>
                    <div style={{ color: "var(--of-text)", fontWeight: 700 }}>{item.label}</div>
                    <div className="of-empty-text">{item.text} dos estudos</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.85rem", color: "var(--of-text-2)" }}>
                <span>Distribuição consolidada</span>
                <span>
                  {goAprovados} GO ({Math.round(goPct)}%) | {noGos} NO-GO ({Math.round(noGoPct)}%) | {pendentes} Pendente ({Math.round(pendPct)}%)
                </span>
              </div>
              <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2 }}>
                <div style={{ width: `${goPct}%`, background: "var(--of-green)" }} />
                <div style={{ width: `${noGoPct}%`, background: "var(--of-red)" }} />
                <div style={{ width: `${pendPct}%`, background: "var(--of-text-3)" }} />
              </div>
              {totalEstudos === 0 ? <p className="of-empty-text">Cadastre estudos para visualizar o termômetro decisório.</p> : null}
            </div>
          </div>
        </article>

        <article className="of-card" style={{ marginBottom: 20 }}>
          <div className="of-card-title">Nova análise / Atualizar estudo</div>
          <p className="of-empty-text" style={{ marginTop: 6 }}>
            Consolide a viabilidade física, ambiental, jurídica e financeira de cada empreendimento.
          </p>
          <form action={saveViabilidadeAction} style={{ marginTop: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                alignItems: "start",
              }}
            >
              <FormField label="Selecionar obra">
                <select name="obra_id" className="of-input" defaultValue="" required disabled={!obras.length}>
                  <option value="" disabled>
                    {obras.length ? "Selecione uma obra" : "Nenhuma obra disponível"}
                  </option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="GO / NO-GO">
                <select name="go_no_go" className="of-input" defaultValue="pendente">
                  <option value="pendente">Em análise</option>
                  <option value="go">GO</option>
                  <option value="no_go">NO-GO</option>
                </select>
              </FormField>
              <FormField label="Parecer consolidado" fullWidth>
                <textarea
                  name="parecer"
                  className="of-input"
                  placeholder="Resumo executivo da recomendação, principais premissas e ressalvas."
                  rows={4}
                  style={{ minHeight: 112, resize: "vertical" }}
                />
              </FormField>
            </div>

            <FormSection title="Dados físicos do empreendimento">
              <FormField label="Área do terreno (m²)">
                <input name="area_terreno_m2" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="Área construída (m²)">
                <input name="area_construida_m2" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="Prazo da obra (meses)">
                <input name="prazo_obra_meses" type="number" className="of-input" placeholder="0" />
              </FormField>
              <FormField label="Índice de aproveitamento">
                <input name="indice_aproveitamento" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="Taxa de ocupação (%)">
                <input name="taxa_ocupacao" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="Custo estimado / m² (R$)">
                <input name="custo_m2" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="Preço de venda / m² (R$)">
                <input name="preco_venda_m2" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
            </FormSection>

            <FormSection title="Análise econômico-financeira">
              <FormField label="Investimento total (R$)">
                <input name="valor_investimento" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="Receita esperada (R$)">
                <input name="receita_esperada" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="ROI (%)">
                <input name="roi_percent" type="number" step="0.1" className="of-input" placeholder="0,0" />
              </FormField>
              <FormField label="Payback (meses)">
                <input name="payback_meses" type="number" className="of-input" placeholder="0" />
              </FormField>
              <FormField label="VPL — Valor Presente Líquido (R$)">
                <input name="vpl" type="number" step="0.01" className="of-input" placeholder="0,00" />
              </FormField>
              <FormField label="TIR — Taxa Interna de Retorno (%)">
                <input name="tir_percent" type="number" step="0.1" className="of-input" placeholder="0,0" />
              </FormField>
            </FormSection>

            <FormSection title="Análise técnica">
              <FormField label="Status técnico">
                <select name="status_tecnico" className="of-input" defaultValue="pendente">
                  <option value="pendente">Pendente</option>
                  <option value="ok">Aprovado</option>
                  <option value="restricao">Com restrição</option>
                </select>
              </FormField>
              <FormField label="Impacto ambiental">
                <select name="impacto_ambiental" className="of-input" defaultValue="nao_avaliado">
                  <option value="nao_avaliado">Não avaliado</option>
                  <option value="baixo">Baixo</option>
                  <option value="medio">Médio</option>
                  <option value="alto">Alto</option>
                  <option value="nao_aplicavel">Não aplicável</option>
                </select>
              </FormField>
              <FormField label="Notas técnicas" fullWidth>
                <textarea
                  name="notas_tecnicas"
                  className="of-input"
                  rows={4}
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder="Condições do terreno, acesso, fundações, restrições de engenharia e premissas ambientais."
                />
              </FormField>
            </FormSection>

            <FormSection title="Análise legal">
              <FormField label="Status legal">
                <select name="status_legal" className="of-input" defaultValue="pendente">
                  <option value="pendente">Pendente</option>
                  <option value="ok">Aprovado</option>
                  <option value="restricao">Com restrição</option>
                </select>
              </FormField>
              <FormField label="Notas legais" fullWidth>
                <textarea
                  name="notas_legais"
                  className="of-input"
                  rows={4}
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder="Zoneamento, licenças, matrículas, due diligence e exigências regulatórias."
                />
              </FormField>
            </FormSection>

            <FormSection title="Análise econômica">
              <FormField label="Status econômico">
                <select name="status_economico" className="of-input" defaultValue="pendente">
                  <option value="pendente">Pendente</option>
                  <option value="ok">Aprovado</option>
                  <option value="restricao">Com restrição</option>
                </select>
              </FormField>
              <FormField label="Notas econômicas" fullWidth>
                <textarea
                  name="notas_economicas"
                  className="of-input"
                  rows={4}
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder="Sensibilidade de preço, funding, risco de mercado, cronograma de vendas e premissas financeiras."
                />
              </FormField>
            </FormSection>

            <FormSection title="Registro de riscos estratégicos">
              <FormField label="Riscos (JSON)" fullWidth>
                <textarea
                  name="riscos"
                  className="of-input"
                  rows={5}
                  style={{ minHeight: 150, resize: "vertical", fontFamily: "var(--font-geist-mono, monospace)" }}
                  placeholder='[{"descricao":"Atraso no licenciamento","probabilidade":"alta","impacto":"alto","mitigacao":"Antecipar protocolo e consultoria ambiental"}]'
                />
              </FormField>
            </FormSection>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
              <p className="of-empty-text" style={{ margin: 0 }}>
                Os riscos aceitam JSON estruturado e alimentam a matriz visual dos estudos salvos.
              </p>
              <button type="submit" className="of-btn-primary" disabled={!obras.length} style={!obras.length ? { opacity: 0.6, cursor: "not-allowed" } : undefined}>
                Salvar análise completa
              </button>
            </div>
          </form>
        </article>

        <article className="of-card" style={{ marginBottom: 20 }}>
          <div className="of-card-title">Todos os estudos</div>
          <div className="of-table-wrap" style={{ border: 0, marginTop: 12 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>GO/NO-GO</th>
                  <th>Técnico</th>
                  <th>Legal</th>
                  <th>Econômico</th>
                  <th>Investimento</th>
                  <th>ROI</th>
                  <th>Payback</th>
                  <th>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {estudosComObraNome.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontWeight: 700 }}>{item.obraNome}</span>
                        <span className="of-empty-text">{item.parecer || "Sem parecer consolidado."}</span>
                      </div>
                    </td>
                    <td>{goNoGoBadge(item.go_no_go)}</td>
                    <td>{statusBadge(item.status_tecnico)}</td>
                    <td>{statusBadge(item.status_legal)}</td>
                    <td>{statusBadge(item.status_economico)}</td>
                    <td>{formatCurrency(item.valor_investimento)}</td>
                    <td>{formatPercent(item.roi_percent)}</td>
                    <td>{formatPayback(item.payback_meses)}</td>
                    <td>{formatUpdatedAt(item.updated_at)}</td>
                  </tr>
                ))}
                {estudosComObraNome.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="of-empty-text">
                      Nenhum estudo cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        {estudosComObraNome.map((estudo) => (
          <RiskMatrix key={estudo.id} estudoId={estudo.id} riscos={estudo.riscos} obraNome={estudo.obraNome ?? estudo.obra_nome ?? "Obra"} />
        ))}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {[
            { label: "Análise técnica", resumo: resumoTecnico },
            { label: "Análise legal", resumo: resumoLegal },
            { label: "Análise econômica", resumo: resumoEconomico },
          ].map(({ label, resumo }) => {
            const total = resumo.aprovados + resumo.restricoes + resumo.pendentes;
            return (
              <article key={label} className="of-card">
                <div className="of-card-title">
                  {label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {[
                    { label: "Aprovados", count: resumo.aprovados, color: "var(--of-green)" },
                    { label: "Com restrição", count: resumo.restricoes, color: "var(--of-yellow)" },
                    { label: "Pendentes", count: resumo.pendentes, color: "var(--of-text-3)" },
                  ].map(({ label: statusLabel, count, color }) => (
                    <div key={statusLabel}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 3 }}>
                        <span style={{ color: "var(--of-text-2)" }}>{statusLabel}</span>
                        <span style={{ color, fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--of-border)", borderRadius: 2 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${total ? (count / total) * 100 : 0}%`,
                            background: color,
                            borderRadius: 2,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
  );
}
