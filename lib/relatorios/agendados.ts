// Relatórios Agendados

export type FrequenciaAgendamento = "diaria" | "semanal" | "mensal" | "personalizado";

export interface RelatórioAgendado {
  id: string;
  usuário_id: string;
  nome: string;
  tipo_relatório: "operacional" | "financeiro" | "equipe" | "materiais";
  frequencia: FrequenciaAgendamento;
  dias_semana?: number[]; // 0-6, onde 0 = domingo
  dia_mes?: number; // 1-31
  horario_envio: string; // HH:mm
  destinatarios: string[]; // emails
  ativo: boolean;
  ultima_execucao?: Date;
  proxima_execucao: Date;
  criado_em: Date;
}

export interface FiltrosRelatório {
  obra_ids?: string[];
  periodo_inicio: Date;
  periodo_fim: Date;
  incluir_graficos: boolean;
  incluir_resumo: boolean;
  incluir_detalhes: boolean;
}

export const tipos_relatório = {
  operacional: {
    titulo: "Relatório Operacional",
    descricao: "Progresso de obras, cronogramas, tarefas",
    campos: ["progresso", "atrasos", "tarefas_concluidas", "proximas_atividades"],
  },
  financeiro: {
    titulo: "Relatório Financeiro",
    descricao: "Receitas, despesas, orçamentos",
    campos: ["receita_total", "despesas", "margem", "orcamentos"],
  },
  equipe: {
    titulo: "Relatório de Equipe",
    descricao: "Produtividade, presença, alocação",
    campos: ["produtividade", "presenca", "alocacao", "horas_trabalhadas"],
  },
  materiais: {
    titulo: "Relatório de Materiais",
    descricao: "Estoque, consumo, pedidos",
    campos: ["estoque", "consumo", "pedidos_pendentes", "custos"],
  },
};

export function proximaExecucao(config: RelatórioAgendado): Date {
  const agora = new Date();
  const [horas, minutos] = config.horario_envio.split(":").map(Number);
  
  const proxima = new Date(agora);
  proxima.setHours(horas, minutos, 0, 0);
  
  if (proxima <= agora) {
    proxima.setDate(proxima.getDate() + 1);
  }
  
  return proxima;
}

export function deveProcesarAgora(config: RelatórioAgendado): boolean {
  const agora = new Date();
  const [horas, minutos] = config.horario_envio.split(":").map(Number);
  
  return (
    config.ativo &&
    agora.getHours() === horas &&
    agora.getMinutes() === minutos
  );
}
