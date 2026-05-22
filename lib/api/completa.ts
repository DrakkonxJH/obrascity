// API REST Completa e Webhooks

export type MetodoHTTP = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type EventoWebhook = "obra.criada" | "obra.atualizada" | "tarefa.criada" | "tarefa.completa" | "material.adicionado" | "relatório.gerado" | "usuário.adicionado";

export interface EndpointAPI {
  id: string;
  caminho: string;
  metodo: MetodoHTTP;
  descricao: string;
  parametros: ParametroAPI[];
  resposta_exemplo: Record<string, any>;
  requer_autenticacao: boolean;
  escopos_acesso: string[];
}

export interface ParametroAPI {
  nome: string;
  tipo: "string" | "number" | "boolean" | "array" | "object";
  obrigatorio: boolean;
  descricao: string;
  valores_padrao?: any;
}

export interface ChaveAPI {
  id: string;
  empresa_id: string;
  nome: string;
  chave_publica: string;
  chave_privada: string;
  escopos: string[];
  rate_limit_rpm: number;
  ativa: boolean;
  ultima_utilizacao?: Date;
  criada_em: Date;
  expiracao?: Date;
}

export interface Webhook {
  id: string;
  empresa_id: string;
  url_destino: string;
  eventos: EventoWebhook[];
  headers_customizados?: Record<string, string>;
  ativa: boolean;
  tentativas_falhas: number;
  proxima_tentativa?: Date;
  criada_em: Date;
  atualizada_em: Date;
}

export interface EntregaWebhook {
  id: string;
  webhook_id: string;
  evento: EventoWebhook;
  payload: Record<string, any>;
  status: "pendente" | "entregue" | "falha";
  tentativa: number;
  tempo_resposta_ms?: number;
  codigo_resposta_http?: number;
  proxima_tentativa?: Date;
  criada_em: Date;
}

export interface DocumentacaoEndpoint {
  titulo: string;
  descricao: string;
  endpoint: EndpointAPI;
  exemplo_requisicao: string;
  exemplo_resposta: string;
  codigos_erro: { codigo: number; mensagem: string }[];
}

export const eventosDisponiveis: Record<EventoWebhook, string> = {
  "obra.criada": "Quando uma obra é criada",
  "obra.atualizada": "Quando uma obra é atualizada",
  "tarefa.criada": "Quando uma tarefa é criada",
  "tarefa.completa": "Quando uma tarefa é marcada completa",
  "material.adicionado": "Quando um material é adicionado",
  "relatório.gerado": "Quando um relatório é gerado",
  "usuário.adicionado": "Quando um usuário é adicionado",
};

export function gerarChaveAPI(empresa_id: string): { publica: string; privada: string } {
  const publica = `pk_${empresa_id}_${Math.random().toString(36).substr(2, 16)}`;
  const privada = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  return { publica, privada };
}

export function validarChaveAPI(chave: string): boolean {
  return /^(pk|sk)_[a-z0-9]+$/.test(chave);
}

export function calcularHashWebhook(payload: string, chaveSecreta: string): string {
  const crypto = require("crypto");
  return crypto.createHmac("sha256", chaveSecreta).update(payload).digest("hex");
}
