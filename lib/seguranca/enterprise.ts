// Segurança Corporativa (SSO, SAML, Backup, MFA)

export type TipoProvedorSSO = "saml2" | "oauth2_enterprise" | "openid";
export type TipoMFA = "totp" | "sms" | "email" | "hardware_token";

export interface ConfigSSO {
  id: string;
  empresa_id: string;
  tipo: TipoProvedorSSO;
  entity_id: string;
  metadata_url?: string;
  certificate_path?: string;
  ativa: boolean;
  criada_em: Date;
}

export interface ConfigMFA {
  id: string;
  usuário_id: string;
  tipos_habilitados: TipoMFA[];
  obrigatorio: boolean;
  backup_codes: string[];
  criada_em: Date;
  atualizada_em: Date;
}

export interface RegistroAuditoriaSegurança {
  id: string;
  empresa_id: string;
  usuário_id?: string;
  tipo_evento: "login" | "logout" | "alteracao_permissao" | "acesso_recurso" | "tentativa_falha" | "exportacao";
  ip_origem: string;
  user_agent: string;
  resultado: "sucesso" | "falha";
  detalhes: string;
  criado_em: Date;
}

export interface ConfigBackup {
  id: string;
  empresa_id: string;
  tipo_armazenamento: "local" | "s3" | "azure" | "google_cloud";
  frequencia: "diaria" | "semanal" | "mensal";
  retencao_dias: number;
  ultimo_backup: Date;
  proximoBackup: Date;
  ativa: boolean;
}

export interface RegistroBackup {
  id: string;
  config_id: string;
  arquivo_chave: string;
  tamanho_bytes: number;
  registros_totais: number;
  criptografado: boolean;
  status: "completo" | "falha" | "em_progresso";
  criado_em: Date;
  expiracao: Date;
}

export interface PolíticaSenha {
  mínimo_caracteres: number;
  requer_maiuscula: boolean;
  requer_numeros: boolean;
  requer_simbolos: boolean;
  expiracao_dias: number;
  historico_anterior: number;
  bloqueio_tentativas_falhas: number;
  tempo_bloqueio_minutos: number;
}

export const politicaSenhaEnterprise: PolíticaSenha = {
  mínimo_caracteres: 12,
  requer_maiuscula: true,
  requer_numeros: true,
  requer_simbolos: true,
  expiracao_dias: 90,
  historico_anterior: 5,
  bloqueio_tentativas_falhas: 5,
  tempo_bloqueio_minutos: 30,
};

export function validarSenhaEnterprise(senha: string, politica: PolíticaSenha): { valida: boolean; erros: string[] } {
  const erros: string[] = [];

  if (senha.length < politica.mínimo_caracteres) {
    erros.push(`Mínimo ${politica.mínimo_caracteres} caracteres`);
  }
  if (politica.requer_maiuscula && !/[A-Z]/.test(senha)) {
    erros.push("Deve conter letras maiúsculas");
  }
  if (politica.requer_numeros && !/[0-9]/.test(senha)) {
    erros.push("Deve conter números");
  }
  if (politica.requer_simbolos && !/[!@#$%^&*]/.test(senha)) {
    erros.push("Deve conter símbolos especiais");
  }

  return { valida: erros.length === 0, erros };
}

export function gerarBackupCodes(quantidade: number = 10): string[] {
  const codigos: string[] = [];
  for (let i = 0; i < quantidade; i++) {
    codigos.push(`${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 8)}`);
  }
  return codigos;
}
