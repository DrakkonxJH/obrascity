"use server";

import { revalidatePath } from "next/cache";
import { upsertViabilidade, type RiscoItem, type UpsertViabilidadeInput } from "@/lib/db/viabilidade";

function parseOptionalNumber(formData: FormData, field: string) {
  const value = parseFloat(String(formData.get(field) ?? ""));
  return Number.isNaN(value) ? undefined : value;
}

function parseRiscos(rawValue: FormDataEntryValue | null): RiscoItem[] {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
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
  } catch {
    return [];
  }
}

export async function saveViabilidadeAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const statusTecnico = String(formData.get("status_tecnico") ?? "pendente").trim();
  const statusLegal = String(formData.get("status_legal") ?? "pendente").trim();
  const statusEconomico = String(formData.get("status_economico") ?? "pendente").trim();
  const goNoGo = String(formData.get("go_no_go") ?? "pendente").trim();
  const parecer = String(formData.get("parecer") ?? "").trim();
  const impactoAmbiental = String(formData.get("impacto_ambiental") ?? "nao_avaliado").trim() || "nao_avaliado";
  const notasTecnicas = String(formData.get("notas_tecnicas") ?? "").trim();
  const notasLegais = String(formData.get("notas_legais") ?? "").trim();
  const notasEconomicas = String(formData.get("notas_economicas") ?? "").trim();
  const riscos = parseRiscos(formData.get("riscos"));

  if (!obraId) {
    throw new Error("Obra obrigatória para viabilidade");
  }

  const payload: UpsertViabilidadeInput = {
    obraId,
    statusTecnico,
    statusLegal,
    statusEconomico,
    goNoGo,
    parecer,
    impactoAmbiental,
    notasTecnicas,
    notasLegais,
    notasEconomicas,
    riscos,
  };

  const valorInvestimento = parseOptionalNumber(formData, "valor_investimento");
  if (valorInvestimento !== undefined) payload.valorInvestimento = valorInvestimento;

  const receitaEsperada = parseOptionalNumber(formData, "receita_esperada");
  if (receitaEsperada !== undefined) payload.receitaEsperada = receitaEsperada;

  const roiPercent = parseOptionalNumber(formData, "roi_percent");
  if (roiPercent !== undefined) payload.roiPercent = roiPercent;

  const paybackMeses = parseOptionalNumber(formData, "payback_meses");
  if (paybackMeses !== undefined) payload.paybackMeses = paybackMeses;

  const vpl = parseOptionalNumber(formData, "vpl");
  if (vpl !== undefined) payload.vpl = vpl;

  const tirPercent = parseOptionalNumber(formData, "tir_percent");
  if (tirPercent !== undefined) payload.tirPercent = tirPercent;

  const areaTerrenoM2 = parseOptionalNumber(formData, "area_terreno_m2");
  if (areaTerrenoM2 !== undefined) payload.areaTerrenoM2 = areaTerrenoM2;

  const areaConstruidaM2 = parseOptionalNumber(formData, "area_construida_m2");
  if (areaConstruidaM2 !== undefined) payload.areaConstruidaM2 = areaConstruidaM2;

  const custoM2 = parseOptionalNumber(formData, "custo_m2");
  if (custoM2 !== undefined) payload.custoM2 = custoM2;

  const precoVendaM2 = parseOptionalNumber(formData, "preco_venda_m2");
  if (precoVendaM2 !== undefined) payload.precoVendaM2 = precoVendaM2;

  const prazoObraMeses = parseOptionalNumber(formData, "prazo_obra_meses");
  if (prazoObraMeses !== undefined) payload.prazoObraMeses = prazoObraMeses;

  const indiceAproveitamento = parseOptionalNumber(formData, "indice_aproveitamento");
  if (indiceAproveitamento !== undefined) payload.indiceAproveitamento = indiceAproveitamento;

  const taxaOcupacao = parseOptionalNumber(formData, "taxa_ocupacao");
  if (taxaOcupacao !== undefined) payload.taxaOcupacao = taxaOcupacao;

  await upsertViabilidade(payload);

  revalidatePath("/viabilidade");
}

