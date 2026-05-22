"use client";

import { useMemo } from "react";

type Row = { orcado: number; realizado: number };

export function useFinanceiro(rows: Row[]) {
  return useMemo(() => {
    const orcado = rows.reduce((acc, row) => acc + row.orcado, 0);
    const realizado = rows.reduce((acc, row) => acc + row.realizado, 0);
    const consumoPercentual = orcado > 0 ? Math.round((realizado / orcado) * 100) : 0;

    return { orcado, realizado, consumoPercentual };
  }, [rows]);
}
