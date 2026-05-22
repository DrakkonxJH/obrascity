// Integração Google Sheets

export interface ConfigGoogleSheets {
  id: string;
  empresa_id: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  ativo: boolean;
  conectado_em: Date;
}

export interface SyncSheets {
  id: string;
  empresa_id: string;
  planilha_id: string;
  abat_id: string;
  intervalo: string; // ex: "A1:Z1000"
  tipo_sincronizacao: "bidirecional" | "importar" | "exportar";
  modelo_dados: "obras" | "equipes" | "materiais" | "cronograma" | "financeiro";
  frequencia: "tempo_real" | "horaria" | "diaria";
  ultima_sincronizacao?: Date;
  ativo: boolean;
}

export interface MapeamentoCampos {
  id: string;
  sync_id: string;
  coluna_sheets: string; // ex: "A"
  campo_banco: string; // ex: "nome_obra"
  tipo: "texto" | "numero" | "data" | "booleano";
  obrigatorio: boolean;
  transformacao?: string; // função para transformar dados
}

export interface LogSincronizacao {
  id: string;
  sync_id: string;
  timestamp: Date;
  status: "sucesso" | "erro" | "parcial";
  linhas_processadas: number;
  linhas_erro: number;
  mensagem?: string;
}

export function validarIntervalo(intervalo: string): boolean {
  const regex = /^[A-Z]\d+:[A-Z]\d+$/;
  return regex.test(intervalo);
}

export function extrairColunaLetra(coluna: number): string {
  let resultado = "";
  while (coluna >= 0) {
    resultado = String.fromCharCode(65 + (coluna % 26)) + resultado;
    coluna = Math.floor(coluna / 26) - 1;
  }
  return resultado;
}
