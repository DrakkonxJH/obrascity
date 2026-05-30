"use client";

import { Fragment, useState } from "react";
import type { RiscoItem } from "@/lib/db/viabilidade";

function riskLevel(prob: string, imp: string) {
  const pScore = prob === "alta" ? 3 : prob === "media" ? 2 : 1;
  const iScore = imp === "alto" ? 3 : imp === "medio" ? 2 : 1;
  const score = pScore * iScore;

  if (score >= 6) {
    return "var(--of-red)";
  }
  if (score >= 3) {
    return "var(--of-yellow)";
  }
  return "var(--of-green)";
}

export function RiskMatrix({
  estudoId,
  riscos,
  obraNome,
}: {
  estudoId: string;
  riscos: RiscoItem[];
  obraNome: string;
}) {
  const [items] = useState<RiscoItem[]>(riscos);

  return (
    <article id={`risk-matrix-${estudoId}`} className="of-card" style={{ marginTop: 20 }}>
      <div className="of-card-title">Matriz de riscos - {obraNome}</div>
      <p className="of-empty-text" style={{ marginTop: 6, marginBottom: 16 }}>
        Visualização consolidada dos riscos do estudo. Ajustes podem ser feitos ao atualizar a análise.
      </p>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1fr 1fr",
            gap: 4,
            maxWidth: 400,
            fontSize: "0.8rem",
          }}
        >
          <div style={{ gridColumn: "1", gridRow: "1" }} />
          {["Baixo", "Médio", "Alto"].map((impacto) => (
            <div
              key={impacto}
              style={{ textAlign: "center", color: "var(--of-text-2)", padding: "4px 0", fontWeight: 600 }}
            >
              {impacto}
            </div>
          ))}
          {(["alta", "media", "baixa"] as const).map((probabilidade) => (
            <Fragment key={probabilidade}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "var(--of-text-2)",
                  fontWeight: 600,
                  paddingRight: 8,
                }}
              >
                {probabilidade === "alta" ? "Alta" : probabilidade === "media" ? "Média" : "Baixa"}
              </div>
              {(["baixo", "medio", "alto"] as const).map((impacto) => {
                const level = riskLevel(probabilidade, impacto);
                const count = items.filter(
                  (risk) => risk.probabilidade === probabilidade && risk.impacto === impacto,
                ).length;

                return (
                  <div
                    key={`${probabilidade}-${impacto}`}
                    style={{
                      background: `${level}20`,
                      border: `1px solid ${level}60`,
                      borderRadius: 6,
                      padding: "12px 4px",
                      textAlign: "center",
                      fontWeight: count > 0 ? 700 : 400,
                      color: count > 0 ? level : "var(--of-text-3)",
                    }}
                  >
                    {count > 0 ? count : "·"}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", fontSize: "0.78rem", color: "var(--of-text-3)" }}>
          <span>Linhas: Probabilidade (Alta→Baixa)</span>
          <span>Colunas: Impacto (Baixo→Alto)</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="of-empty-text">Nenhum risco cadastrado para este estudo.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((risk, index) => {
            const level = riskLevel(risk.probabilidade, risk.impacto);
            return (
              <div
                key={`${risk.descricao}-${index}`}
                style={{
                  background: "var(--of-bg-3)",
                  border: `1px solid ${level}40`,
                  borderLeft: `3px solid ${level}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, flex: 1 }}>{risk.descricao}</span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      background: `${level}20`,
                      color: level,
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {risk.probabilidade.charAt(0).toUpperCase() + risk.probabilidade.slice(1)} × {risk.impacto.charAt(0).toUpperCase() + risk.impacto.slice(1)}
                  </span>
                </div>
                {risk.mitigacao ? (
                  <p style={{ fontSize: "0.83rem", color: "var(--of-text-2)", margin: 0 }}>{risk.mitigacao}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
