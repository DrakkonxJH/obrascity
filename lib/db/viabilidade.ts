import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";

export type RiscoItem = {
  descricao: string;
  probabilidade: "baixa" | "media" | "alta";
  impacto: "baixo" | "medio" | "alto";
  mitigacao: string;
};

export type ViabilidadeItem = {
  id: string;
  obra_id: string;
  status_tecnico: string;
  status_legal: string;
  status_economico: string;
  go_no_go: string;
  parecer: string;
  riscos: RiscoItem[];
  aprovado_por: string | null;
  aprovado_em: string | null;
  valor_investimento: number | null;
  receita_esperada: number | null;
  roi_percent: number | null;
  payback_meses: number | null;
  vpl: number | null;
  tir_percent: number | null;
  area_terreno_m2: number | null;
  area_construida_m2: number | null;
  custo_m2: number | null;
  preco_venda_m2: number | null;
  impacto_ambiental: string;
  notas_tecnicas: string;
  notas_legais: string;
  notas_economicas: string;
  prazo_obra_meses: number | null;
  indice_aproveitamento: number | null;
  taxa_ocupacao: number | null;
  updated_at: string;
};

export type UpsertViabilidadeInput = {
  obraId: string;
  statusTecnico: string;
  statusLegal: string;
  statusEconomico: string;
  goNoGo: string;
  parecer: string;
  riscos?: RiscoItem[];
  valorInvestimento?: number;
  receitaEsperada?: number;
  roiPercent?: number;
  paybackMeses?: number;
  vpl?: number;
  tirPercent?: number;
  areaTerrenoM2?: number;
  areaConstruidaM2?: number;
  custoM2?: number;
  precoVendaM2?: number;
  impactoAmbiental?: string;
  notasTecnicas?: string;
  notasLegais?: string;
  notasEconomicas?: string;
  prazoObraMeses?: number;
  indiceAproveitamento?: number;
  taxaOcupacao?: number;
};

function isMissingViabilidadeTable(message: string) {
  const text = message.toLowerCase();
  return text.includes("viabilidade_estudos") && text.includes("could not find the table");
}

function isOutdatedViabilidadeSchema(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes("viabilidade_estudos") &&
    (text.includes("schema cache") || text.includes("could not find the") || (text.includes("column") && text.includes("does not exist")))
  );
}

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseRiscos(value: unknown): RiscoItem[] {
  let source = value;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      descricao: String(item.descricao ?? ""),
      probabilidade:
        item.probabilidade === "alta" || item.probabilidade === "media" || item.probabilidade === "baixa"
          ? item.probabilidade
          : "media",
      impacto: item.impacto === "alto" || item.impacto === "medio" || item.impacto === "baixo" ? item.impacto : "medio",
      mitigacao: String(item.mitigacao ?? ""),
    }));
}

export async function supportsViabilidadeEstudos() {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("viabilidade_estudos")
    .select("id", { head: true, count: "exact" })
    .eq("empresa_id", empresaId)
    .limit(1);

  if (error) {
    if (isMissingViabilidadeTable(error.message)) {
      return false;
    }
    throw new Error(`Erro ao verificar viabilidade: ${error.message}`);
  }

  return true;
}

export async function listViabilidade(): Promise<ViabilidadeItem[]> {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const expandedSelect = [
    "id",
    "obra_id",
    "status_tecnico",
    "status_legal",
    "status_economico",
    "go_no_go",
    "parecer",
    "riscos",
    "aprovado_por",
    "aprovado_em",
    "valor_investimento",
    "receita_esperada",
    "roi_percent",
    "payback_meses",
    "vpl",
    "tir_percent",
    "area_terreno_m2",
    "area_construida_m2",
    "custo_m2",
    "preco_venda_m2",
    "impacto_ambiental",
    "notas_tecnicas",
    "notas_legais",
    "notas_economicas",
    "prazo_obra_meses",
    "indice_aproveitamento",
    "taxa_ocupacao",
    "updated_at",
  ].join(", ");
  const legacySelect = "id, obra_id, status_tecnico, status_legal, status_economico, go_no_go, parecer, riscos, aprovado_por, aprovado_em, updated_at";

  const result = await supabase
    .from("viabilidade_estudos")
    .select(expandedSelect)
    .eq("empresa_id", empresaId)
    .order("updated_at", { ascending: false });
  let data = (result.data ?? null) as Array<Record<string, unknown>> | null;
  let error = result.error;

  if (error && isOutdatedViabilidadeSchema(error.message)) {
    const fallback = await supabase
      .from("viabilidade_estudos")
      .select(legacySelect)
      .eq("empresa_id", empresaId)
      .order("updated_at", { ascending: false });
    data = (fallback.data ?? null) as Array<Record<string, unknown>> | null;
    error = fallback.error;
  }

  if (error) {
    return [];
  }

  return (data ?? []).map((item) => ({
    id: String(item.id ?? ""),
    obra_id: String(item.obra_id ?? ""),
    status_tecnico: String(item.status_tecnico ?? "pendente"),
    status_legal: String(item.status_legal ?? "pendente"),
    status_economico: String(item.status_economico ?? "pendente"),
    go_no_go: String(item.go_no_go ?? "pendente"),
    parecer: String(item.parecer ?? ""),
    riscos: parseRiscos(item.riscos),
    aprovado_por: item.aprovado_por ? String(item.aprovado_por) : null,
    aprovado_em: item.aprovado_em ? String(item.aprovado_em) : null,
    valor_investimento: parseNullableNumber(item.valor_investimento),
    receita_esperada: parseNullableNumber(item.receita_esperada),
    roi_percent: parseNullableNumber(item.roi_percent),
    payback_meses: parseNullableNumber(item.payback_meses),
    vpl: parseNullableNumber(item.vpl),
    tir_percent: parseNullableNumber(item.tir_percent),
    area_terreno_m2: parseNullableNumber(item.area_terreno_m2),
    area_construida_m2: parseNullableNumber(item.area_construida_m2),
    custo_m2: parseNullableNumber(item.custo_m2),
    preco_venda_m2: parseNullableNumber(item.preco_venda_m2),
    impacto_ambiental: String(item.impacto_ambiental ?? "nao_avaliado") || "nao_avaliado",
    notas_tecnicas: String(item.notas_tecnicas ?? ""),
    notas_legais: String(item.notas_legais ?? ""),
    notas_economicas: String(item.notas_economicas ?? ""),
    prazo_obra_meses: parseNullableNumber(item.prazo_obra_meses),
    indice_aproveitamento: parseNullableNumber(item.indice_aproveitamento),
    taxa_ocupacao: parseNullableNumber(item.taxa_ocupacao),
    updated_at: String(item.updated_at ?? ""),
  }));
}

export async function upsertViabilidade(input: UpsertViabilidadeInput) {
  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const legacyPayload = {
    empresa_id: empresaId,
    obra_id: input.obraId,
    status_tecnico: input.statusTecnico,
    status_legal: input.statusLegal,
    status_economico: input.statusEconomico,
    go_no_go: input.goNoGo,
    parecer: input.parecer,
    riscos: input.riscos ?? [],
    updated_at: now,
  };
  const expandedPayload = {
    ...legacyPayload,
    valor_investimento: input.valorInvestimento ?? null,
    receita_esperada: input.receitaEsperada ?? null,
    roi_percent: input.roiPercent ?? null,
    payback_meses: input.paybackMeses ?? null,
    vpl: input.vpl ?? null,
    tir_percent: input.tirPercent ?? null,
    area_terreno_m2: input.areaTerrenoM2 ?? null,
    area_construida_m2: input.areaConstruidaM2 ?? null,
    custo_m2: input.custoM2 ?? null,
    preco_venda_m2: input.precoVendaM2 ?? null,
    impacto_ambiental: input.impactoAmbiental ?? "nao_avaliado",
    notas_tecnicas: input.notasTecnicas ?? "",
    notas_legais: input.notasLegais ?? "",
    notas_economicas: input.notasEconomicas ?? "",
    prazo_obra_meses: input.prazoObraMeses ?? null,
    indice_aproveitamento: input.indiceAproveitamento ?? null,
    taxa_ocupacao: input.taxaOcupacao ?? null,
  };

  let { error } = await supabase.from("viabilidade_estudos").upsert(expandedPayload, {
    onConflict: "empresa_id,obra_id",
  });

  if (error && isOutdatedViabilidadeSchema(error.message)) {
    const fallback = await supabase.from("viabilidade_estudos").upsert(legacyPayload, {
      onConflict: "empresa_id,obra_id",
    });
    error = fallback.error;
  }

  if (error) {
    if (isMissingViabilidadeTable(error.message)) {
      console.warn("[viabilidade] tabela viabilidade_estudos ausente, retornando sem persistir.");
      return;
    }
    throw new Error(`Erro ao salvar viabilidade: ${error.message}`);
  }
}
