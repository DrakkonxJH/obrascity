"use client";

import { useMemo } from "react";
import type { Obra } from "@/types/domain";

export function useObras(obras: Obra[]) {
  const resumo = useMemo(() => {
    const total = obras.length;
    const emAndamento = obras.filter((obra) => obra.status === "andamento").length;
    const concluidas = obras.filter((obra) => obra.status === "concluida").length;
    return { total, emAndamento, concluidas };
  }, [obras]);

  return { resumo };
}
