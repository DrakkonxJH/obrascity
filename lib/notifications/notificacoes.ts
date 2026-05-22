// Notificações e Alertas em Tempo Real

export type NotificationType = 
  | "obra_atrasada"
  | "tarefa_vencida"
  | "novo_comentario"
  | "material_faltando"
  | "orcamento_excedido"
  | "equipe_falta";

export type NotificationChannel = "email" | "push" | "in-app" | "whatsapp";

export interface Notification {
  id: string;
  usuário_id: string;
  obra_id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  canais: NotificationChannel[];
  lida: boolean;
  urgente: boolean;
  criada_em: Date;
  lida_em?: Date;
}

export interface AlertConfig {
  usuário_id: string;
  tipo: NotificationType;
  ativo: boolean;
  canais: NotificationChannel[];
  horario_envio?: string;
}

export const notificationMessages: Record<NotificationType, { titulo: string; template: string }> = {
  obra_atrasada: {
    titulo: "⚠️ Obra Atrasada",
    template: "A obra {obra_nome} está {dias_atraso} dias atrasada",
  },
  tarefa_vencida: {
    titulo: "📋 Tarefa Vencida",
    template: "Tarefa '{tarefa_nome}' venceu em {data_vencimento}",
  },
  novo_comentario: {
    titulo: "💬 Novo Comentário",
    template: "{usuário_nome} comentou em '{item_nome}'",
  },
  material_faltando: {
    titulo: "📦 Material Faltando",
    template: "Material '{material_nome}' está em falta na obra {obra_nome}",
  },
  orcamento_excedido: {
    titulo: "💰 Orçamento Excedido",
    template: "Obra {obra_nome} excedeu orçamento em {percentual}%",
  },
  equipe_falta: {
    titulo: "👥 Falta de Equipe",
    template: "Faltam {num_pessoas} pessoas em {obra_nome} para {data}",
  },
};

export function shouldNotify(alertConfig: AlertConfig, tipo: NotificationType): boolean {
  return alertConfig.ativo && alertConfig.tipo === tipo;
}

export function formatNotification(
  tipo: NotificationType,
  variables: Record<string, string | number>
): string {
  const template = notificationMessages[tipo]?.template || "";
  return template.replace(/{([^}]+)}/g, (_, key) => String(variables[key] || ""));
}
