'use server';

// app/actions/crmActions.ts
// NEXT.JS SERVER ACTIONS - PRODUCTION READY TYPESCRIPT IMPLEMENTATION

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
  priority: 'Alta' | 'Média' | 'Baixa';
  startDate: string;
  date: string;
  cost: number;
  fvsSigned: boolean;
  fvsSignedBy?: string | null;
  fvsSignedDate?: string | null;
  fvsHash?: string | null;
  isWorkflowCard: boolean;
  currentStepIndex: number; // Index in the Master Workflow Pipeline
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
}

export interface Sector {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number;
}

// IN-MEMORY FALLBACK DB (Simulates your database. Replace this with MongoDB, Prisma, or PostgreSQL queries)
let mockDbCards: Card[] = [
  {
    id: "card-1",
    title: "Obra Residencial Jardins - Unidade 302",
    desc: "Projeto padrão de incorporação cruzando todas as etapas sequenciais de processos e procedimentos da construtora.",
    responsible: "Juliana Torres",
    priority: "Média",
    startDate: "2026-06-25",
    date: "2026-06-30",
    cost: 450000.00,
    isWorkflowCard: true,
    currentStepIndex: 0,
    fvsSigned: false,
    subtasks: [
      { id: "sub-1-1", title: "Ligar para o Lead e qualificar interesse", done: true },
      { id: "sub-1-2", title: "Registrar dados de contato e do empreendimento", done: true },
      { id: "sub-1-3", title: "Verificar viabilidade de financiamento inicial", done: false },
      { id: "sub-1-4", title: "Agendar visita técnica ou comercial", done: false }
    ],
    comments: [
      { author: "Juliana Torres", text: "Proposta iniciada. Lead aquecido.", date: "25/06/2026 10:00" }
    ],
    logs: [{ text: "Projeto iniciado no Fluxo Programado (POP) da Construtora", date: "25/06/2026 09:00" }],
    attachments: []
  },
  {
    id: "card-2",
    title: "Edifício Zona Sul - Fundação Bloco B",
    desc: "Lote estrutural de fundações em fase avançada.",
    responsible: "Ricardo Santos",
    priority: "Alta",
    startDate: "2026-06-25",
    date: "2026-07-12",
    cost: 85000.00,
    isWorkflowCard: true,
    currentStepIndex: 4,
    fvsSigned: false,
    subtasks: [
      { id: "sub-5-1", title: "Escavação mecânica de valas das sapatas", done: true },
      { id: "sub-5-2", title: "Montagem das armaduras de aço e espaçadores", done: true },
      { id: "sub-5-3", title: "Concretagem usinada de fundação estrutural", done: false },
      { id: "sub-5-4", title: "Iniciar cura úmida por aspersão (mínimo 7 dias)", done: false }
    ],
    comments: [],
    logs: [{ text: "Projeto promovido para Fase 5: Execução de Sapatas", date: "25/06/2026 08:30" }],
    attachments: []
  }
];

let mockDbWorkflow: WorkflowStep[] = [
  {
    step: 1,
    sectorId: "vendas",
    stageName: "Captação & Leads",
    color: "purple",
    icon: "fa-users",
    subtasks: [
      "Ligar para o Lead e qualificar interesse",
      "Registrar dados de contato e do empreendimento",
      "Verificar viabilidade de financiamento inicial",
      "Agendar visita técnica ou comercial"
    ]
  },
  {
    step: 2,
    sectorId: "vendas",
    stageName: "Visita Comercial",
    color: "purple",
    icon: "fa-users",
    subtasks: [
      "Apresentar memorial descritivo da obra",
      "Apresentar simulação de fluxo de pagamentos",
      "Coletar documentos do comprador (RG/CPF)",
      "Assinar proposta e reservar lote/unidade"
    ]
  },
  {
    step: 3,
    sectorId: "financeiro",
    stageName: "Auditoria & Orçamento",
    color: "emerald",
    icon: "fa-file-invoice-dollar",
    subtasks: [
      "Análise de crédito e certidões negativas do comprador",
      "Homologação e validação da proposta comercial",
      "Registrar entrada de sinal no fluxo de caixa",
      "Aprovar viabilidade físico-financeira final"
    ]
  },
  {
    step: 4,
    sectorId: "engenharia",
    stageName: "Layout & Projetos",
    color: "fire",
    icon: "fa-hard-hat",
    subtasks: [
      "Realizar verificação topográfica inicial",
      "Efetuar demarcação de divisas (gabarito)",
      "Compatibilizar projetos (Arquitetura x Estrutural)",
      "Aprovar layout final com o cliente"
    ]
  },
  {
    step: 5,
    sectorId: "engenharia",
    stageName: "Execução de Sapatas",
    color: "fire",
    icon: "fa-hard-hat",
    subtasks: [
      "Escavação mecânica de valas das sapatas",
      "Montagem das armaduras de aço e espaçadores",
      "Concretagem usinada de fundação estrutural",
      "Iniciar cura úmida por aspersão (mínimo 7 dias)"
    ]
  }
];

let mockDbSectors: Sector[] = [
  { id: "vendas", name: "Vendas / Comercial", icon: "fa-users", color: "purple", budgetLimit: 500000.00 },
  { id: "financeiro", name: "Financeiro", icon: "fa-file-invoice-dollar", color: "emerald", budgetLimit: 200000.00 },
  { id: "engenharia", name: "Engenharia", icon: "fa-hard-hat", color: "fire", budgetLimit: 90000.00 }
];

// SERVER ACTIONS API

/**
 * Loads all CRM data from the database.
 * Filters data belonging to the logged-in tenant in production.
 */
export async function getCRMData() {
  try {
    // In production:
    // const session = await getSession();
    // const cards = await prisma.card.findMany({ where: { tenantId: session.tenantId } });
    
    return {
      success: true,
      cards: mockDbCards,
      workflow: mockDbWorkflow,
      sectors: mockDbSectors
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Saves or updates a project Card in the database.
 */
export async function saveCardAction(cardData: Card) {
  try {
    const existingIndex = mockDbCards.findIndex(c => c.id === cardData.id);
    if (existingIndex !== -1) {
      mockDbCards[existingIndex] = cardData;
    } else {
      mockDbCards.push(cardData);
    }
    return { success: true, card: cardData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Promotes a Card to a new Workflow Step and updates the database.
 */
export async function promoteCardAction(cardId: string, nextStepIndex: number, nextSubtasks: Subtask[], log: AuditLog) {
  try {
    const card = mockDbCards.find(c => c.id === cardId);
    if (card) {
      card.currentStepIndex = nextStepIndex;
      card.subtasks = nextSubtasks;
      card.logs.unshift(log);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates the company Master Pipeline (POP Workflow Sequence) in the database.
 */
export async function saveWorkflowPipelineAction(updatedWorkflow: WorkflowStep[], updatedCards?: Card[]) {
  try {
    mockDbWorkflow = updatedWorkflow;
    if (updatedCards) {
      mockDbCards = updatedCards;
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a Card from the database.
 */
export async function deleteCardAction(cardId: string) {
  try {
    mockDbCards = mockDbCards.filter(c => c.id !== cardId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
