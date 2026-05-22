// 🎯 Features Premium - Agrupadas por Categoria
// Visão consolidada de todas as 13+ features

export type TierPlano = "starter" | "pro" | "enterprise";
export type CategoriaFeature = 
  | "operacional" 
  | "relatórios" 
  | "integração" 
  | "automacao" 
  | "comunicação" 
  | "segurança" 
  | "api";

export interface FeatureAgrupada {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaFeature;
  tiers: TierPlano[];
  modulo: string;
}

export const featuresAgrupadas: Record<CategoriaFeature, FeatureAgrupada[]> = {
  operacional: [
    {
      id: "dashboard",
      nome: "Dashboard Customizável",
      descricao: "Widgets personalizáveis, 8 tipos, layout adaptável",
      categoria: "operacional",
      tiers: ["pro", "enterprise"],
      modulo: "lib/dashboard/customizacao",
    },
    {
      id: "mobile",
      nome: "Aplicativo Mobile",
      descricao: "PWA, offline sync, push notifications, 500MB storage",
      categoria: "operacional",
      tiers: ["pro", "enterprise"],
      modulo: "lib/mobile/configuracao",
    },
    {
      id: "acesso",
      nome: "Controle de Acesso Avançado",
      descricao: "5 roles, 10 permissões, audit logging",
      categoria: "operacional",
      tiers: ["pro", "enterprise"],
      modulo: "lib/permissions/controle-acesso",
    },
  ],

  relatórios: [
    {
      id: "relatórios_agendados",
      nome: "Relatórios Agendados",
      descricao: "4 tipos, 3 frequências, envio automático",
      categoria: "relatórios",
      tiers: ["pro", "enterprise"],
      modulo: "lib/relatórios/agendados",
    },
  ],

  comunicação: [
    {
      id: "notificacoes",
      nome: "Notificações & Alertas",
      descricao: "6 tipos, 4 canais, templates customizáveis",
      categoria: "comunicação",
      tiers: ["pro", "enterprise"],
      modulo: "lib/notifications/notificacoes",
    },
    {
      id: "chat",
      nome: "Chat Integrado",
      descricao: "Conversas, menções, reações, histórico",
      categoria: "comunicação",
      tiers: ["enterprise"],
      modulo: "lib/comunicação/chat",
    },
  ],

  integração: [
    {
      id: "whatsapp",
      nome: "WhatsApp Integration",
      descricao: "Business API, templates, validação telefone",
      categoria: "integração",
      tiers: ["enterprise"],
      modulo: "lib/integrações/whatsapp",
    },
    {
      id: "google_sheets",
      nome: "Google Sheets Sync",
      descricao: "OAuth, mapeamento campos, sincronização bidi",
      categoria: "integração",
      tiers: ["enterprise"],
      modulo: "lib/integrações/google-sheets",
    },
    {
      id: "zapier",
      nome: "Zapier Integration",
      descricao: "7 triggers, 7 ações, webhooks com retry",
      categoria: "integração",
      tiers: ["enterprise"],
      modulo: "lib/integrações/zapier",
    },
    {
      id: "slack",
      nome: "Slack Integration",
      descricao: "Notificações canalizadas, mentions",
      categoria: "integração",
      tiers: ["enterprise"],
      modulo: "lib/integrações/slack",
    },
  ],

  automacao: [
    {
      id: "workflow",
      nome: "Automações & Workflows",
      descricao: "Visual builder, triggers, condições, ações",
      categoria: "automacao",
      tiers: ["enterprise"],
      modulo: "lib/automacoes/workflow",
    },
    {
      id: "documentos",
      nome: "Gestão de Documentos & OCR",
      descricao: "7 tipos documento, OCR, extração campos",
      categoria: "automacao",
      tiers: ["enterprise"],
      modulo: "lib/documentos/gestão",
    },
  ],

  segurança: [
    {
      id: "segurança",
      nome: "Segurança Corporativa",
      descricao: "SSO/SAML, MFA, audit logging, backup automatizado",
      categoria: "segurança",
      tiers: ["enterprise"],
      modulo: "lib/segurança/enterprise",
    },
  ],

  api: [
    {
      id: "api",
      nome: "API REST Completa",
      descricao: "REST API, webhooks, chaves, documentação, rate limiting",
      categoria: "api",
      tiers: ["enterprise"],
      modulo: "lib/api/completa",
    },
  ],
};

// Contadores
export const resumoFeatures = {
  pro: Object.values(featuresAgrupadas).flat().filter(f => f.tiers.includes("pro")).length,
  enterprise: Object.values(featuresAgrupadas).flat().filter(f => f.tiers.includes("enterprise")).length,
  total: Object.values(featuresAgrupadas).flat().length,
};
