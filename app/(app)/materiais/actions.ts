"use server";

import { revalidatePath } from "next/cache";
import {
  adjudicarCotacao,
  createCotacaoRodada,
  createCotacaoCompra,
  createCotacaoFornecedor,
  createMaterial,
  createPurchaseOrder,
  importMaterials,
  importPurchaseOrders,
  updateMaterial,
} from "@/lib/db/materiais";
import { parseMaterialsCsv, parsePurchaseOrdersCsv } from "@/lib/materials/csv";
import {
  csvUploadPolicy,
  scanCsvContent,
  validateUploadCollection,
} from "@/lib/security/file-upload";
import { createSecurityAlert } from "@/lib/security/security-alerts";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isProfileRole } from "@/lib/auth/roles";
import { createApprovalRequest } from "@/lib/db/approvals";
import { requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";

export async function createMaterialAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const unidade = String(formData.get("unidade") ?? "").trim();
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const mínimo = Number(formData.get("mínimo") ?? 0);

  if (!nome || !unidade) {
    throw new Error("Nome e unidade do material sao obrigatorios");
  }

  await createMaterial({ nome, unidade, quantidade, mínimo });
  revalidatePath("/materiais");
}

export async function updateMaterialAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const unidade = String(formData.get("unidade") ?? "").trim();
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const mínimo = Number(formData.get("mínimo") ?? 0);

  if (!id) {
    throw new Error("Material invalido");
  }
  if (!nome || !unidade) {
    throw new Error("Nome e unidade do material sao obrigatorios");
  }

  await updateMaterial(id, { nome, unidade, quantidade, mínimo });
  revalidatePath("/materiais");
}

export async function createPurchaseOrderAction(
  _prev: ImportMaterialsState,
  formData: FormData,
): Promise<ImportMaterialsState> {
  const materialId = String(formData.get("material_id") ?? "").trim();
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const fornecedor = String(formData.get("fornecedor") ?? "").trim();
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const valor = Number(formData.get("valor") ?? 0);
  const status = String(formData.get("status") ?? "pendente").trim() || "pendente";

  if (!materialId || !obraId) {
    return {
      status: "error",
      message: "Selecione o material e a obra.",
    };
  }
  if (!fornecedor) {
    return {
      status: "error",
      message: "Informe o fornecedor.",
    };
  }

  const profile = await getCurrentProfile();
  const roleValue = String(profile?.role ?? "");
  if (!isProfileRole(roleValue)) {
    return {
      status: "error",
      message: "Perfil inválido para registrar pedido de compra.",
    };
  }

  const requiresApproval = requiresApprovalForAmount(roleValue, valor);
  const requiredRole = resolveRequiredRoleByAmount(valor);
  const createdOrderId = await createPurchaseOrder({
    materialId,
    obraId,
    fornecedor,
    quantidade,
    valor,
    status: requiresApproval ? "aguardando_aprovacao" : status,
  });

  if (requiresApproval) {
    await createApprovalRequest({
      entityType: "purchase_order",
      entityId: createdOrderId,
      entityRef: fornecedor,
      amount: valor,
      requesterRole: roleValue,
      requiredRole,
      notes: "Pedido acima da alçada do solicitante.",
      metadata: {
        obraId,
        materialId,
        quantidade,
        fornecedor,
      },
    });
  }
  revalidatePath("/materiais");

  return {
    status: "success",
    message: requiresApproval
      ? `Pedido criado em aprovação (${requiredRole}).`
      : "Pedido de compra criado com sucesso.",
  };
}

export type ImportMaterialsState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function importMaterialsAction(
  _state: ImportMaterialsState,
  formData: FormData,
): Promise<ImportMaterialsState> {
  const files = formData.getAll("file").filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return {
      status: "error",
      message: "Selecione um arquivo CSV para importar.",
    };
  }

  const file = files[0];

  try {
    validateUploadCollection(files, csvUploadPolicy());
  } catch (error) {
    await createSecurityAlert({
      category: "upload",
      severity: "medium",
      reason: "invalid_materials_csv_upload",
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Arquivo invalido para importacao.",
    };
  }

  const csvText = await scanCsvContent(file, { maxRows: 5000 });
  const rows = parseMaterialsCsv(csvText);

  if (rows.length === 0) {
    return {
      status: "error",
      message: "Nenhum material valido foi encontrado no CSV.",
    };
  }

  const result = await importMaterials(rows);
  revalidatePath("/materiais");

  return {
    status: "success",
    message: `Importacao concluida: ${result.created} criados, ${result.updated} atualizados${result.skipped > 0 ? `, ${result.skipped} duplicados ignorados` : ""}.`,
  };
}

export async function importPurchaseOrdersAction(
  _state: ImportMaterialsState,
  formData: FormData,
): Promise<ImportMaterialsState> {
  const files = formData.getAll("file").filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return {
      status: "error",
      message: "Selecione um arquivo CSV para importar.",
    };
  }

  const file = files[0];

  try {
    validateUploadCollection(files, csvUploadPolicy());
  } catch (error) {
    await createSecurityAlert({
      category: "upload",
      severity: "medium",
      reason: "invalid_purchase_orders_csv_upload",
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Arquivo invalido para importacao.",
    };
  }

  const csvText = await scanCsvContent(file, { maxRows: 5000 });
  const rows = parsePurchaseOrdersCsv(csvText);

  if (rows.length === 0) {
    return {
      status: "error",
      message: "Nenhum pedido valido foi encontrado no CSV.",
    };
  }

  const result = await importPurchaseOrders(rows);
  revalidatePath("/materiais");

  return {
    status: "success",
    message: `Pedidos importados: ${result.created} criados, ${result.updated} atualizados${result.skipped > 0 ? `, ${result.skipped} ignorados` : ""}.`,
  };
}

export async function createCotacaoCompraAction(formData: FormData) {
  const obraId = String(formData.get("obra_id") ?? "").trim();
  const materialIdRaw = String(formData.get("material_id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();

  if (!obraId || !titulo) {
    throw new Error("Cotação exige obra e título");
  }

  await createCotacaoCompra({
    obraId,
    materialId: materialIdRaw || null,
    titulo,
  });

  revalidatePath("/materiais");
}

export async function createCotacaoFornecedorAction(formData: FormData) {
  const cotacaoId = String(formData.get("cotacao_id") ?? "").trim();
  const fornecedor = String(formData.get("fornecedor") ?? "").trim();
  const valorUnitario = Number(formData.get("valor_unitario") ?? 0);
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const prazoDias = Number(formData.get("prazo_dias") ?? 0);
  const condicoes = String(formData.get("condicoes") ?? "").trim();

  if (!cotacaoId || !fornecedor) {
    throw new Error("Fornecedor de cotação exige cotação e nome");
  }

  await createCotacaoFornecedor({
    cotacaoId,
    fornecedor,
    valorUnitario,
    quantidade,
    prazoDias,
    condicoes,
  });

  revalidatePath("/materiais");
}

export async function createCotacaoRodadaAction(formData: FormData) {
  const cotacaoId = String(formData.get("cotacao_id") ?? "").trim();
  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!cotacaoId || !objetivo) {
    throw new Error("Rodada de negociação exige cotação e objetivo");
  }

  await createCotacaoRodada({
    cotacaoId,
    objetivo,
    observacoes,
  });
  revalidatePath("/materiais");
}

export async function adjudicarCotacaoAction(formData: FormData) {
  const cotacaoId = String(formData.get("cotacao_id") ?? "").trim();
  const fornecedorId = String(formData.get("fornecedor_id") ?? "").trim();
  const statusContrato = String(formData.get("status_contrato") ?? "rascunho").trim();
  const condicoes = String(formData.get("condicoes") ?? "").trim();

  if (!cotacaoId || !fornecedorId) {
    throw new Error("Adjudicação exige cotação e fornecedor vencedor");
  }

  await adjudicarCotacao({
    cotacaoId,
    fornecedorId,
    statusContrato,
    condicoes,
  });
  revalidatePath("/materiais");
}
