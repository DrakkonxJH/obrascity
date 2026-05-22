// Sistema de Automações e Workflow Builder

export type TipoCondicao = "igual" | "diferente" | "maior" | "menor" | "contem" | "nao_contem" | "data_passou";
export type TipoAcaoAutomacao = "criar_tarefa" | "notificar" | "atualizar_campo" | "enviar_email" | "trigger_webhook" | "cancelar_workflow";

export interface Condicao {
  id: string;
  campo: string;
  operador: TipoCondicao;
  valor: unknown;
  conectador?: "E" | "OU";
}

export interface AcaoWorkflow {
  id: string;
  tipo: TipoAcaoAutomacao;
  parametros: Record<string, unknown>;
  atraso_segundos?: number;
}

export interface Workflow {
  id: string;
  obra_id: string;
  nome: string;
  descricao?: string;
  trigger: string; // "nova_tarefa", "data_prazo", "campo_alterado", etc
  condicoes: Condicao[];
  acoes: AcaoWorkflow[];
  ativa: boolean;
  versao: number;
  criado_em: Date;
  atualizado_em: Date;
}

export interface ExecutacaoWorkflow {
  id: string;
  workflow_id: string;
  objeto_id: string; // tarefa_id, obra_id, etc
  status: "pendente" | "executando" | "completo" | "erro";
  acoes_executadas: number;
  tempo_duracao_ms: number;
  erro_mensagem?: string;
  criado_em: Date;
  completado_em?: Date;
}

export interface LogWorkflow {
  id: string;
  workflow_id: string;
  execucao_id: string;
  acao_id: string;
  status: "sucesso" | "erro";
  detalhes: string;
  criado_em: Date;
}

export const condicoesDisponiveis: Record<TipoCondicao, string> = {
  igual: "É igual a",
  diferente: "É diferente de",
  maior: "Maior que",
  menor: "Menor que",
  contem: "Contém",
  nao_contem: "Não contém",
  data_passou: "Data passou",
};

export function validarCondicao(condicao: Condicao): boolean {
  return condicao.campo.length > 0 && condicao.valor !== undefined;
}

export function avaliarCondicoes(condicoes: Condicao[], dados: Record<string, unknown>): boolean {
  return condicoes.every((cond) => {
    const valor = dados[cond.campo];
    switch (cond.operador) {
      case "igual":
        return valor === cond.valor;
      case "diferente":
        return valor !== cond.valor;
      case "maior":
        return Number(valor) > Number(cond.valor);
      case "menor":
        return Number(valor) < Number(cond.valor);
      case "contem":
        return String(valor ?? "").includes(String(cond.valor ?? ""));
      case "nao_contem":
        return !String(valor ?? "").includes(String(cond.valor ?? ""));
      case "data_passou":
        return new Date(String(valor)).getTime() < Date.now();
      default:
        return false;
    }
  });
}
