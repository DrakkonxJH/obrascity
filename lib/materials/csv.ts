export type ParsedMaterialRow = {
  nome: string;
  unidade: string;
  quantidade: number;
  mínimo: number;
};

export type ParsedPurchaseOrderRow = {
  material: string;
  obra: string;
  fornecedor: string;
  quantidade: number;
  valor: number;
  status: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseDelimitedLine(line: string, delimiter: "," | ";") {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function parseNumber(value: string) {
  const normalized = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickHeaderIndex(headers: string[], aliases: string[]) {
  const headerMap = new Map(headers.map((header, index) => [normalizeText(header), index]));
  for (const alias of aliases) {
    const index = headerMap.get(alias);
    if (typeof index === "number") return index;
  }
  return -1;
}

export function parseMaterialsCsv(csvText: string) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const firstLine = lines[0];
  const delimiter: "," | ";" = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const headers = parseDelimitedLine(firstLine, delimiter);

  const nomeIndex = pickHeaderIndex(headers, ["nome", "material", "material_nome", "item"]);
  const unidadeIndex = pickHeaderIndex(headers, ["unidade", "unid", "medida", "unidade_medida"]);
  const quantidadeIndex = pickHeaderIndex(headers, [
    "quantidade",
    "estoque",
    "estoque_atual",
    "saldo",
    "qtd",
  ]);
  const mínimoIndex = pickHeaderIndex(headers, [
    "mínimo",
    "estoque_mínimo",
    "estoque_mínimo",
    "mínimo_estoque",
    "limite",
  ]);

  if (nomeIndex < 0 || unidadeIndex < 0) {
    throw new Error(
      "CSV invalido: use cabecalhos como nome/material e unidade. Ex.: nome,unidade,quantidade,mínimo",
    );
  }

  const rows: ParsedMaterialRow[] = [];

  for (const line of lines.slice(1)) {
    const values = parseDelimitedLine(line, delimiter);
    const nome = values[nomeIndex]?.trim() ?? "";
    const unidade = values[unidadeIndex]?.trim() ?? "";

    if (!nome || !unidade) {
      continue;
    }

    rows.push({
      nome,
      unidade,
      quantidade: quantidadeIndex >= 0 ? parseNumber(values[quantidadeIndex] ?? "0") : 0,
      mínimo: mínimoIndex >= 0 ? parseNumber(values[mínimoIndex] ?? "0") : 0,
    });
  }

  return rows;
}

export function parsePurchaseOrdersCsv(csvText: string) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const firstLine = lines[0];
  const delimiter: "," | ";" = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const headers = parseDelimitedLine(firstLine, delimiter);

  const materialIndex = pickHeaderIndex(headers, ["material", "nome_material", "material_nome", "item"]);
  const obraIndex = pickHeaderIndex(headers, ["obra", "nome_obra", "obra_nome", "projeto"]);
  const quantidadeIndex = pickHeaderIndex(headers, ["quantidade", "qtd", "volume", "saldo"]);
  const valorIndex = pickHeaderIndex(headers, ["valor", "preco", "preço", "total"]);
  const fornecedorIndex = pickHeaderIndex(headers, ["fornecedor", "supplier", "vendor"]);
  const statusIndex = pickHeaderIndex(headers, ["status", "situacao", "situação"]);

  if (materialIndex < 0 || obraIndex < 0) {
    throw new Error(
      "CSV invalido: use cabecalhos como material e obra. Ex.: material,obra,quantidade,valor,status",
    );
  }

  const rows: ParsedPurchaseOrderRow[] = [];

  for (const line of lines.slice(1)) {
    const values = parseDelimitedLine(line, delimiter);
    const material = values[materialIndex]?.trim() ?? "";
    const obra = values[obraIndex]?.trim() ?? "";

    if (!material || !obra) {
      continue;
    }

    rows.push({
      material,
      obra,
      fornecedor: fornecedorIndex >= 0 ? values[fornecedorIndex]?.trim() ?? "" : "",
      quantidade: quantidadeIndex >= 0 ? parseNumber(values[quantidadeIndex] ?? "0") : 0,
      valor: valorIndex >= 0 ? parseNumber(values[valorIndex] ?? "0") : 0,
      status: (statusIndex >= 0 ? values[statusIndex] : "")?.trim() || "pendente",
    });
  }

  return rows;
}
