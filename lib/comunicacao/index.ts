// 💬 Comunicação e Colaboração - Consolidada

export * from './chat';

// Tipos unificados de comunicação
export type CanalComunicação = "chat" | "email" | "notificacao" | "mencao";

export interface ConfigComunicação {
  canal: CanalComunicação;
  descricao: string;
  ativo: boolean;
  tempo_real: boolean;
}

export const canaisComunicação: Record<CanalComunicação, ConfigComunicação> = {
  chat: {
    canal: "chat",
    descricao: "Chat integrado por projeto",
    ativo: true,
    tempo_real: true,
  },
  email: {
    canal: "email",
    descricao: "Notificações por email",
    ativo: true,
    tempo_real: false,
  },
  notificacao: {
    canal: "notificacao",
    descricao: "Notificações em tempo real",
    ativo: true,
    tempo_real: true,
  },
  mencao: {
    canal: "mencao",
    descricao: "Menções e @usuários",
    ativo: true,
    tempo_real: true,
  },
};
