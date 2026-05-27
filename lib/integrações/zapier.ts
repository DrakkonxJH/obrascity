// Integração Zapier para Automações

export type TipoTriggerZapier = "nova_tarefa" | "tarefa_completa" | "novo_material" | "orcamento_excedido" | "data_prazo" | "novo_usuário" | "relatório_gerado";
export type TipoAccaoZapier = "enviar_email" | "criar_tarefa" | "adicionar_linha_sheet" | "enviar_mensagem" | "criar_evento" | "atualizar_contato" | "postar_slack";

export interface ConfigZapier {
  id: string;
  obra_id: string;
  usuário_id: string;
  oauth_token: string;
  refresh_token: string;
  token_expiracao: Date;
  ativa: boolean;
  criada_em: Date;
}

export interface ZapierHook {
  id: string;
  config_id: string;
  trigger: TipoTriggerZapier;
  acoes: TipoAccaoZapier[];
  url_webhook: string;
  filtros?: Record<string, unknown>;
  mapeamento_campos?: Record<string, string>;
  ativa: boolean;
  criada_em: Date;
  atualizada_em: Date;
}

export interface EventoZapier {
  id: string;
  hook_id: string;
  tipo_trigger: TipoTriggerZapier;
  dados_evento: Record<string, unknown>;
  status_processamento: "pendente" | "enviado" | "erro";
  tentativas: number;
  proxima_tentativa?: Date;
  erro_mensagem?: string;
  criado_em: Date;
}

export const triggerDisponiveis: Record<TipoTriggerZapier, string> = {
  nova_tarefa: "Quando uma nova tarefa é criada",
  tarefa_completa: "Quando uma tarefa é marcada como completa",
  novo_material: "Quando um novo material é registrado",
  orcamento_excedido: "Quando o orçamento é excedido",
  data_prazo: "Quando uma data de prazo chega",
  novo_usuário: "Quando um novo usuário é adicionado",
  relatório_gerado: "Quando um relatório é gerado",
};

export const acoesDisponiveis: Record<TipoAccaoZapier, string> = {
  enviar_email: "Enviar email",
  criar_tarefa: "Criar tarefa",
  adicionar_linha_sheet: "Adicionar linha em Google Sheets",
  enviar_mensagem: "Enviar mensagem",
  criar_evento: "Criar evento no calendário",
  atualizar_contato: "Atualizar contato",
  postar_slack: "Postar no Slack",
};

export function gerarURLWebhook(configId: string): string {
  return `https://api.obrascity.com/v1/zapier/webhook/${configId}`;
}

export function validarOAuthToken(token: string): boolean {
  return token.length > 20 && token.startsWith("xox-");
}
