// Controle de Acesso Avançado

export type RoleAvancada = "admin" | "gerente_obra" | "supervisor" | "operario" | "consultor";
export type Permissao = 
  | "visualizar_obra"
  | "editar_obra"
  | "deletar_obra"
  | "visualizar_financeiro"
  | "editar_financeiro"
  | "visualizar_equipe"
  | "editar_equipe"
  | "aprovar_despesas"
  | "gerar_relatórios"
  | "gerenciar_permissoes";

export interface PermissaoPorProjeto {
  usuário_id: string;
  obra_id: string;
  role: RoleAvancada;
  permissoes_customizadas?: Permissao[];
  ativo: boolean;
  criado_em: Date;
}

export interface LogAuditoria {
  id: string;
  usuário_id: string;
  obra_id: string;
  acao: string;
  tipo_recurso: string; // "obra", "financeiro", "equipe", etc
  recurso_id: string;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
  timestamp: Date;
  ip?: string;
  user_agent?: string;
}

// Permissões padrão por role
export const permissoesPorRole: Record<RoleAvancada, Permissao[]> = {
  admin: [
    "visualizar_obra",
    "editar_obra",
    "deletar_obra",
    "visualizar_financeiro",
    "editar_financeiro",
    "visualizar_equipe",
    "editar_equipe",
    "aprovar_despesas",
    "gerar_relatórios",
    "gerenciar_permissoes",
  ],
  gerente_obra: [
    "visualizar_obra",
    "editar_obra",
    "visualizar_financeiro",
    "editar_financeiro",
    "visualizar_equipe",
    "editar_equipe",
    "gerar_relatórios",
  ],
  supervisor: [
    "visualizar_obra",
    "editar_obra",
    "visualizar_equipe",
    "editar_equipe",
    "gerar_relatórios",
  ],
  operario: ["visualizar_obra", "editar_obra"],
  consultor: ["visualizar_obra", "gerar_relatórios"],
};

export function temPermissao(
  permissoes: Permissao[],
  permissaoRequerida: Permissao
): boolean {
  return permissoes.includes(permissaoRequerida);
}

export function registrarAuditoria(
  usuárioId: string,
  obraId: string,
  acao: string,
  tipoRecurso: string,
  recursoId: string,
  dadosAnteriores?: Record<string, unknown>,
  dadosNovos?: Record<string, unknown>
): LogAuditoria {
  return {
    id: `audit_${Date.now()}`,
    usuário_id: usuárioId,
    obra_id: obraId,
    acao,
    tipo_recurso: tipoRecurso,
    recurso_id: recursoId,
    dados_anteriores: dadosAnteriores,
    dados_novos: dadosNovos,
    timestamp: new Date(),
  };
}
