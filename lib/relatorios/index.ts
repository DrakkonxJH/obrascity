// 📊 Sistema de Relatórios - Consolidado

export * from './agendados';

// Tipos de relatórios disponíveis
export type TipoRelatório = "obras" | "tarefas" | "materiais" | "financeiro" | "qualidade" | "desempenho";

export interface ConfiguracaoRelatório {
  tipo: TipoRelatório;
  titulo: string;
  descricao: string;
  campos_disponiveis: string[];
  agendavel: boolean;
  exportavel: boolean;
  periodicidades?: ("diaria" | "semanal" | "mensal")[];
}

export const relatóriosDisponiveis: Record<TipoRelatório, ConfiguracaoRelatório> = {
  obras: {
    tipo: "obras",
    titulo: "Relatório de Obras",
    descricao: "Status, andamento e métricas gerais",
    campos_disponiveis: ["nome", "status", "progresso", "orcamento"],
    agendavel: true,
    exportavel: true,
    periodicidades: ["semanal", "mensal"],
  },
  tarefas: {
    tipo: "tarefas",
    titulo: "Relatório de Tarefas",
    descricao: "Tarefas, prazos e responsáveis",
    campos_disponiveis: ["titulo", "status", "prazo", "responsavel"],
    agendavel: true,
    exportavel: true,
    periodicidades: ["diaria", "semanal"],
  },
  materiais: {
    tipo: "materiais",
    titulo: "Relatório de Materiais",
    descricao: "Consumo, estoque e gastos",
    campos_disponiveis: ["nome", "quantidade", "valor", "fornecedor"],
    agendavel: true,
    exportavel: true,
    periodicidades: ["semanal", "mensal"],
  },
  financeiro: {
    tipo: "financeiro",
    titulo: "Relatório Financeiro",
    descricao: "Custos, receitas e análise",
    campos_disponiveis: ["categoria", "valor", "data", "responsavel"],
    agendavel: true,
    exportavel: true,
    periodicidades: ["mensal"],
  },
  qualidade: {
    tipo: "qualidade",
    titulo: "Relatório de Qualidade",
    descricao: "Não-conformidades e melhorias",
    campos_disponiveis: ["tipo", "descricao", "status", "responsavel"],
    agendavel: false,
    exportavel: true,
  },
  desempenho: {
    tipo: "desempenho",
    titulo: "Relatório de Desempenho",
    descricao: "KPIs e métricas de equipes",
    campos_disponiveis: ["equipe", "meta", "realizado", "percentual"],
    agendavel: false,
    exportavel: true,
  },
};
