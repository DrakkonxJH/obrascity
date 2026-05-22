// 🔐 Segurança Corporativa - Consolidada

export * from './enterprise';

// Agrupa todos os aspectos de segurança
export type AspectSegurança = "autenticacao" | "autorizacao" | "auditoria" | "backup";

export interface PoliticaSegurança {
  aspecto: AspectSegurança;
  descricao: string;
  implementado: boolean;
  critico: boolean;
}

export const politicasSegurança: PoliticaSegurança[] = [
  {
    aspecto: "autenticacao",
    descricao: "SSO/SAML 2.0 + Multi-Factor Authentication",
    implementado: true,
    critico: true,
  },
  {
    aspecto: "autorizacao",
    descricao: "Controle de acesso avançado com roles",
    implementado: true,
    critico: true,
  },
  {
    aspecto: "auditoria",
    descricao: "Logging completo de ações e acessos",
    implementado: true,
    critico: true,
  },
  {
    aspecto: "backup",
    descricao: "Backup automatizado com retenção",
    implementado: true,
    critico: true,
  },
];
