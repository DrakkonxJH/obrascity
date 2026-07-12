export type CrmLead = {
  id: string;
  empresaId: string;
  nome: string;
  contato: string;
  cargo: string;
  email: string;
  telefone: string;
  valor: number;
  etapa: "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Fechado" | "Perdido";
  origem: string;
  obra: string;
  prioridade: "Alta" | "Média" | "Baixa";
  ultimaAtividade: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmDealSummary = {
  id: string;
  nome: string;
  stage: string;
  status: string;
  priority: string;
  valor: number;
  probability: number;
  companyName: string;
  contactName: string;
  ownerProfileId: string | null;
  ownerName: string;
  lastActivityAt: string | null;
  nextActivityAt: string | null;
  activitiesTotal: number;
  activitiesOpen: number;
  tags: string[];
  lossReason: string;
  customFields: Record<string, string>;
  playbookItems: Array<{ id: string; label: string; done: boolean }>;
  fvsSigned: boolean;
  fvsSignedBy: string | null;
  fvsSignedDate: string | null;
  fvsHash: string | null;
  comments: any[];
  logs: any[];
};

export type CrmDealActivity = {
  id: string;
  empresaId: string;
  dealId: string;
  type: string;
  subject: string;
  body: string;
  channel: string;
  dueAt: string | null;
  completedAt: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmWorkspace = {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmCustomTab = {
  id: string;
  companyId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  filterEtapa?: string[];
  filterPrioridade?: string[];
  filterOrigem?: string[];
  filterOwnerId?: string[];
  filterSearch?: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmSector = {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number;
  empresaId: string;
};

export type CrmWorkflowStep = {
  id?: string;
  stepOrder: number;
  sectorId: string;
  stageName: string;
  color: string;
  icon: string;
  subtasks: string[];
  empresaId: string;
};

export type UpsertCrmLeadInput = {
  id?: string;
  nome: string;
  contato?: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  valor?: number;
  etapa?: CrmLead["etapa"];
  origem?: string;
  obra?: string;
  prioridade?: CrmLead["prioridade"];
  ultimaAtividade?: string;
  notas?: string;
};

export type UpdateCrmDealInput = {
  nome?: string;
  descricao?: string;
  stage?: string;
  status?: string;
  priority?: string;
  probability?: number;
  valor?: number;
  ownerProfileId?: string | null;
  workspaceId?: string | null;
  lossReason?: string;
  customFields?: Record<string, string>;
  playbookItems?: Array<{ id: string; label: string; done: boolean }>;
  fvsSigned?: boolean;
  fvsSignedBy?: string | null;
  fvsSignedDate?: string | null;
  fvsHash?: string | null;
  comments?: any[];
  logs?: any[];
};

export type CreateCrmDealInput = {
  nome: string;
  descricao?: string;
  stage?: string;
  status?: string;
  priority?: string;
  probability?: number;
  valor?: number;
  ownerProfileId?: string | null;
  workspaceId?: string | null;
  lossReason?: string;
  customFields?: Record<string, string>;
  playbookItems?: Array<{ id: string; label: string; done: boolean }>;
  fvsSigned?: boolean;
  fvsSignedBy?: string | null;
  fvsSignedDate?: string | null;
  fvsHash?: string | null;
  comments?: any[];
  logs?: any[];
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
};

export type CrmDealActivityInput = {
  type: string;
  subject: string;
  body?: string;
  channel?: string;
  dueAt?: string | null;
  done?: boolean;
};
