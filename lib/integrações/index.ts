// 🔌 Integrações Corporativas - Agrupadas

// WhatsApp Integration
export * from './whatsapp';

// Google Sheets Integration
export * from './google-sheets';

// Zapier Integration
export * from './zapier';

// Slack Integration (placeholder)
export const SLACK_INTEGRATION_AVAILABLE = true;

// Type para facilitar uso de integrações
export type IntegraçãoDisponivel = "whatsapp" | "google_sheets" | "zapier" | "slack";

export const integracoesEnterprise: Record<IntegraçãoDisponivel, string> = {
  whatsapp: "Integração WhatsApp",
  google_sheets: "Sync com Google Sheets",
  zapier: "Integração Zapier",
  slack: "Notificações Slack",
};
