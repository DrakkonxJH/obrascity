export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Comment {
  author: string;
  text: string;
  date: string;
}

export interface AuditLog {
  text: string;
  date: string;
}

export interface Attachment {
  name: string;
  url: string;
}

export interface Card {
  id: string;
  title: string;
  desc: string;
  responsible: string;
  priority: "Alta" | "Média" | "Baixa";
  startDate: string;
  date: string;
  cost: number;
  fvsSigned: boolean;
  fvsSignedBy?: string | null;
  fvsSignedDate?: string | null;
  fvsHash?: string | null;
  isWorkflowCard: boolean;
  currentStepIndex: number;
  subtasks: Subtask[];
  comments: Comment[];
  logs: AuditLog[];
  attachments: Attachment[];
}

export interface WorkflowStep {
  step: number;
  sectorId: string;
  stageName: string;
  color: string;
  icon: string;
  subtasks: string[];
  empresa_id?: string;
}

export interface Sector {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number;
}

export const SOP_TEMPLATES = {
  concretagem: {
    title: "Concretagem Estrutural - Bloco [X]",
    desc: "Execução de concretagem de lajes e vigas seguindo a norma NBR 6118. Requer verificação de armadura e cura úmida rigorosa.",
    subtasks: [
      "Verificar aprumo e nível das fôrmas",
      "Checar amarração de armaduras e espaçadores",
      "Validar liberação do engenheiro calculista",
      "Acompanhar lançamento e vibração do concreto",
      "Iniciar cura úmida imediata (mínimo 7 dias)",
    ],
  },
  medicao: {
    title: "Auditoria de Medição - [Empreiteiro]",
    desc: "Aferição de quantitativos de obra para liberação de pagamento mensal. Baseado em projeto executivo e real executado.",
    subtasks: [
      "Coletar medições de campo (trena/laser)",
      "Comparar com cronograma físico-financeiro",
      "Validar qualidade dos serviços executados",
      "Assinar folha de medição com preposto da obra",
    ],
  },
  suprimentos: {
    title: "Geração de Ordem de Compra - [Material]",
    desc: "Cotação e compra de insumos críticos para a fase de fundação/estrutura.",
    subtasks: [
      "Cotar com 3 fornecedores homologados",
      "Analisar custo-benefício e prazo de entrega",
      "Aprovar verba com o setor financeiro",
      "Emitir OC e confirmar cronograma de entrega",
    ],
  },
  alvenaria: {
    title: "Verificação de Prumo Alvenaria - Pavimento [Y]",
    desc: "Auditoria de prumo, nível e esquadro de alvenarias de vedação antes do reboco.",
    subtasks: [
      "Verificar prumo de todas as paredes externas",
      "Validar esquadro de vãos de portas e janelas",
      "Checar amarração com pilares estruturais",
      "Corrigir desvios acima de 5mm",
    ],
  },
} as const;
