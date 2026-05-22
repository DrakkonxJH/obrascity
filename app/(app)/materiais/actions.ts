"use server";

import { revalidatePath } from "next/cache";
import {
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

  await createPurchaseOrder({
    material_id: materialId,
    obra_id: obraId,
    fornecedor,
    quantidade,
    valor,
    status,
  });
  revalidatePath("/materiais");

  return {
    status: "success",
    message: "Pedido de compra criado com sucesso.",
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
