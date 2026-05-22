// 🔔 Notificações e Alertas - Consolidados

export * from './notificacoes';

// Agrupa tipos de notificações
export type TipoNotificacaoGrupo = "alertas" | "tarefas" | "relatórios" | "sistema";

export interface GrupoNotificacao {
  tipo: TipoNotificacaoGrupo;
  descricao: string;
  canais: string[];
  configuravel: boolean;
}

export const gruposNotificacoes: Record<TipoNotificacaoGrupo, GrupoNotificacao> = {
  alertas: {
    tipo: "alertas",
    descricao: "Alertas de sistema e eventos críticos",
    canais: ["email", "sms", "push", "in-app"],
    configuravel: true,
  },
  tarefas: {
    tipo: "tarefas",
    descricao: "Notificações sobre tarefas",
    canais: ["email", "push", "in-app", "slack"],
    configuravel: true,
  },
  relatórios: {
    tipo: "relatórios",
    descricao: "Relatórios e análises",
    canais: ["email", "whatsapp"],
    configuravel: false,
  },
  sistema: {
    tipo: "sistema",
    descricao: "Notificações do sistema",
    canais: ["in-app", "email"],
    configuravel: false,
  },
};
