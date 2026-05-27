// Configuração PWA e Sincronização Mobile

export type PlataformaMobile = "ios" | "android" | "pwa";

export interface ConfigMobile {
  app_id: string;
  app_name: string;
  versao: string;
  plataformas_ativas: PlataformaMobile[];
  push_notifications_ativa: boolean;
  offline_sync_ativa: boolean;
  storage_local_max_mb: number;
  auto_update: boolean;
}

export interface SincronizacaoMobile {
  id: string;
  usuário_id: string;
  obra_id: string;
  ultima_sincronizacao: Date;
  proxima_sincronizacao: Date;
  status: "pendente" | "sincronizando" | "completo" | "erro";
  dados_pendentes: {
    criar: number;
    atualizar: number;
    deletar: number;
  };
  erro_mensagem?: string;
}

export interface RecursoOffline {
  id: string;
  tipo: "imagem" | "documento" | "mapa" | "dado";
  tamanho_bytes: number;
  disponivel_offline: boolean;
  data_download?: Date;
  data_expiracao?: Date;
}

export interface NotificacaoPush {
  id: string;
  usuário_id: string;
  titulo: string;
  corpo: string;
  icone_url?: string;
  acao_url?: string;
  enviada_em: Date;
  lida_em?: Date;
}

export const configPadraoMobile: ConfigMobile = {
  app_id: "com.obrascity.app",
  app_name: "ObrasCitY",
  versao: "1.0.0",
  plataformas_ativas: ["pwa"],
  push_notifications_ativa: true,
  offline_sync_ativa: true,
  storage_local_max_mb: 500,
  auto_update: true,
};

export function calcularEspacoDisponivelOffline(usado: number, maxMB: number): number {
  return Math.max(0, maxMB - usado / 1024 / 1024);
}

export function gerarIdNotificacao(): string {
  return `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
