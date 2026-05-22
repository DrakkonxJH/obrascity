// ⚙️ Automações e Workflows - Consolidados

export * from './workflow';

// Agrupa funcionalidades de automação
export type TipoAutomacao = "workflow" | "agendamento" | "integração" | "escalacao";

export interface GrupoAutomacao {
  tipo: TipoAutomacao;
  descricao: string;
  disponivel_em: ("pro" | "enterprise")[];
  complexidade: "baixa" | "media" | "alta";
}

export const gruposAutomacoes: GrupoAutomacao[] = [
  {
    tipo: "workflow",
    descricao: "Workflows visuais com triggers e ações",
    disponivel_em: ["enterprise"],
    complexidade: "alta",
  },
  {
    tipo: "agendamento",
    descricao: "Tarefas agendadas automaticamente",
    disponivel_em: ["pro", "enterprise"],
    complexidade: "media",
  },
  {
    tipo: "integração",
    descricao: "Automações via Zapier",
    disponivel_em: ["enterprise"],
    complexidade: "media",
  },
  {
    tipo: "escalacao",
    descricao: "Escalação automática de problemas",
    disponivel_em: ["enterprise"],
    complexidade: "media",
  },
];
