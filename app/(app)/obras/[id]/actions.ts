"use server";

import { revalidatePath } from "next/cache";
import { createFinanceiroItem, updateFinanceiroItem } from "@/lib/db/financeiro";
import { updateObra } from "@/lib/db/obras";
import { createCronogramaItem } from "@/lib/db/cronograma";
import { createDiario } from "@/lib/db/diario";
import { createPurchaseOrder } from "@/lib/db/materiais";
import { createRelatórioRequest } from "@/lib/db/relatorios";
import { getQueue, QueueNames } from "@/lib/queue/connection";
import type { ObraStatus } from "@/types/domain";

const VALID_STATUS = new Set<ObraStatus>(["planejamento", "andamento", "atencao", "concluida"]);

function parseCurrencyField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "0").replace(",", ".").trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Valor inválido para ${key}`);
  }
  return value;
}

function refreshObraPages(obraId: string) {
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/obras");
  revalidatePath("/financeiro");
  revalidatePath("/cronograma");
  revalidatePath("/materiais");
  revalidatePath("/diario");
  revalidatePath("/relatorios");
  revalidatePath("/dashboard");
}

export async function updateObraDetalhesAction(obraId: string, formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cliente = String(formData.get("cliente") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ObraStatus;
  const progresso = Number(formData.get("progresso") ?? 0);

  if (!nome) throw new Error("Nome da obra é obrigatório");
  if (!cliente) throw new Error("Cliente da obra é obrigatório");
  if (!VALID_STATUS.has(status)) throw new Error("Status da obra inválido");
  if (!Number.isFinite(progresso) || progresso < 0 || progresso > 100) {
    throw new Error("Progresso deve estar entre 0 e 100");
  }

  await updateObra(obraId, { nome, cliente, status, progresso: Math.round(progresso) });
  refreshObraPages(obraId);
}

export async function addObraFinanceiroItemAction(obraId: string, formData: FormData) {
  const categoria = String(formData.get("categoria") ?? "").trim();
  if (!categoria) throw new Error("Categoria é obrigatória");

  await createFinanceiroItem({
    obra_id: obraId,
    categoria,
    orcado: parseCurrencyField(formData, "orcado"),
    realizado: parseCurrencyField(formData, "realizado"),
  });
  refreshObraPages(obraId);
}

export async function updateObraFinanceiroItemAction(
  obraId: string,
  financeiroId: string,
  formData: FormData,
) {
  const categoria = String(formData.get("categoria") ?? "").trim();
  if (!categoria) throw new Error("Categoria é obrigatória");

  await updateFinanceiroItem({
    id: financeiroId,
    obra_id: obraId,
    categoria,
    orcado: parseCurrencyField(formData, "orcado"),
    realizado: parseCurrencyField(formData, "realizado"),
  });
  refreshObraPages(obraId);
}

export async function addObraCronogramaItemAction(obraId: string, formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const inicio = String(formData.get("inicio") ?? "").trim();
  const fim = String(formData.get("fim") ?? "").trim();
  const status = String(formData.get("status") ?? "planejado").trim();

  if (!nome || !inicio || !fim) {
    throw new Error("Preencha nome, início e fim da atividade");
  }

  await createCronogramaItem({
    obra_id: obraId,
    nome,
    inicio,
    fim,
    status,
  });
  refreshObraPages(obraId);
}

export async function addObraDiarioItemAction(obraId: string, formData: FormData) {
  const data_ref = String(formData.get("data_ref") ?? "").trim();
  if (!data_ref) {
    throw new Error("Data do diário é obrigatória");
  }

  await createDiario({
    obra_id: obraId,
    data_ref,
    clima: String(formData.get("clima") ?? "").trim(),
    efetivo: Number(formData.get("efetivo") ?? 0),
    equipamentos: String(formData.get("equipamentos") ?? "").trim(),
    ocorrencias: String(formData.get("ocorrencias") ?? "").trim(),
    observacoes_ssma: String(formData.get("observacoes_ssma") ?? "").trim(),
    assinatura_url: String(formData.get("assinatura_url") ?? "").trim(),
  });
  refreshObraPages(obraId);
}

export async function addObraPurchaseOrderAction(obraId: string, formData: FormData) {
  const material_id = String(formData.get("material_id") ?? "").trim();
  const fornecedor = String(formData.get("fornecedor") ?? "").trim();
  if (!material_id) {
    throw new Error("Selecione um material para o pedido");
  }

  await createPurchaseOrder({
    material_id,
    obra_id: obraId,
    fornecedor,
    quantidade: Number(formData.get("quantidade") ?? 0),
    valor: Number(formData.get("valor") ?? 0),
    status: String(formData.get("status") ?? "pendente").trim() || "pendente",
  });
  refreshObraPages(obraId);
}

export async function solicitarObraRelatorioAction(obraId: string, formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "progresso").trim();
  const formato = String(formData.get("formato") ?? "pdf").trim() || "pdf";

  const relatórioId = await createRelatórioRequest({
    obra_id: obraId,
    tipo,
    formato,
  });

  const queue = getQueue(QueueNames.REPORTS_GENERATE);
  await queue.add(
    "generate-report",
    {
      relatórioId,
      obraId,
      tipo,
      formato,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId: `report:${relatórioId}`,
    },
  );

  refreshObraPages(obraId);
}
