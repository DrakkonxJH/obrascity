'use server';

import {
  listCrmDealsSummary,
  updateCrmDeal,
  deleteCrmDeal,
  createCrmDeal,
  listCrmSectors,
  upsertCrmSector,
  listCrmWorkflowSteps,
  upsertCrmWorkflowSteps,
} from "@/lib/db/crm";

// Types from the new CRM UI
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
      "Iniciar cura úmida imediata (mínimo 7 dias)"
    ]
  },
  medicao: {
    title: "Auditoria de Medição - [Empreiteiro]",
    desc: "Aferição de quantitativos de obra para liberação de pagamento mensal. Baseado em projeto executivo e real executado.",
    subtasks: [
      "Coletar medições de campo (trena/laser)",
      "Comparar com cronograma físico-financeiro",
      "Validar qualidade dos serviços executados",
      "Assinar folha de medição com preposto da obra"
    ]
  },
  suprimentos: {
    title: "Geração de Ordem de Compra - [Material]",
    desc: "Cotação e compra de insumos críticos para a fase de fundação/estrutura.",
    subtasks: [
      "Cotar com 3 fornecedores homologados",
      "Analisar custo-benefício e prazo de entrega",
      "Aprovar verba com o setor financeiro",
      "Emitir OC e confirmar cronograma de entrega"
    ]
  },
  alvenaria: {
    title: "Verificação de Prumo Alvenaria - Pavimento [Y]",
    desc: "Auditoria de prumo, nível e esquadro de alvenarias de vedação antes do reboco.",
    subtasks: [
      "Verificar prumo de todas as paredes externas",
      "Validar esquadro de vãos de portas e janelas",
      "Checar amarração com pilares estruturais",
      "Corrigir desvios acima de 5mm"
    ]
  }
};

function mapStageToStepIndex(stage: string): number {
  const stages = ["novos", "qualificacao", "proposta", "negociacao", "ganho", "perdido"];
  const idx = stages.indexOf(stage.toLowerCase());
  return idx === -1 ? 0 : idx;
}

function mapDealToCard(deal: any): Card {
  return {
    id: deal.id,
    title: deal.nome,
    desc: deal.descricao || "Sem descrição",
    responsible: deal.owner_name || "Não atribuído",
    priority: (deal.priority as any) || 'Média',
    startDate: deal.last_activity_at || new Date().toISOString(),
    date: deal.next_activity_at || new Date().toISOString(),
    cost: deal.valor || 0,
    fvsSigned: Boolean(deal.fvs_signed),
    fvsSignedBy: deal.fvs_signed_by || null,
    fvsSignedDate: deal.fvs_signed_date || null,
    fvsHash: deal.fvs_hash || null,
    isWorkflowCard: true,
    currentStepIndex: mapStageToStepIndex(deal.stage),
    subtasks: (deal.playbook_items || []).map((item: any, i: number) => ({
      id: item.id || `sub-${i}`,
      title: item.label,
      done: item.done
    })),
    comments: deal.comments || [],
    logs: deal.logs || [],
    attachments: []
  };
}

export async function getCRMData() {
  try {
    const deals = await listCrmDealsSummary();
    const cards = deals.map(mapDealToCard);
    const workflow = await listCrmWorkflowSteps();
    const sectors = await listCrmSectors();

    return {
      success: true,
      cards,
      workflow: workflow.map(step => ({
        step: step.step_order,
        sectorId: step.sector_id,
        stageName: step.stage_name,
        color: step.color,
        icon: step.icon,
        subtasks: step.subtasks,
      })),
      sectors: sectors.map(sector => ({
        id: sector.id,
        name: sector.name,
        icon: sector.icon,
        color: sector.color,
        budgetLimit: sector.budget_limit,
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveCardAction(card: Card) {
  try {
    const workflow = await listCrmWorkflowSteps();
    const patch: any = {
      nome: card.title,
      descricao: card.desc,
      priority: card.priority.toLowerCase(),
      valor: card.cost,
      stage: workflow[card.currentStepIndex]?.stage_name || "novos",
      fvs_signed: card.fvsSigned,
      fvs_signed_by: card.fvsSignedBy,
      fvs_signed_date: card.fvsSignedDate,
      fvs_hash: card.fvsHash,
      playbook_items: card.subtasks.map(s => ({ id: s.id, label: s.title, done: s.done })),
      comments: card.comments,
      logs: card.logs,
    };

    if (card.id && card.id !== `card-${Date.now()}`) {
      // Update existing deal
      await updateCrmDeal(card.id, patch);
    } else {
      // Create new deal
      const newDealId = await createCrmDeal({
        nome: card.title,
        descricao: card.desc,
        stage: patch.stage,
        priority: card.priority.toLowerCase(),
        valor: card.cost,
        fvs_signed: card.fvsSigned,
        fvs_signed_by: card.fvsSignedBy,
        fvs_signed_date: card.fvsSignedDate,
        fvs_hash: card.fvsHash,
        playbook_items: card.subtasks.map(s => ({ id: s.id, label: s.title, done: s.done })),
        comments: card.comments,
        logs: card.logs,
      });
      // Update the card object with the real ID from DB
      card.id = newDealId.id;
    }
    return { success: true, card };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function promoteCardAction(cardId: string, nextStepIndex: number, nextSubtasks: Subtask[], log: AuditLog) {
  try {
    const workflow = await listCrmWorkflowSteps();
    const nextStage = workflow[nextStepIndex]?.stage_name || "novos";
    await updateCrmDeal(cardId, { stage: nextStage });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCardAction(cardId: string) {
  try {
    await deleteCrmDeal(cardId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveWorkflowPipelineAction(updatedWorkflow: WorkflowStep[], updatedCards?: Card[]) {
  try {
    const dbSteps = updatedWorkflow.map(step => ({
      step_order: step.step,
      sector_id: step.sectorId,
      stage_name: step.stageName,
      color: step.color,
      icon: step.icon,
      subtasks: step.subtasks,
    }));

    await upsertCrmWorkflowSteps(dbSteps);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveSectorAction(sector: Sector) {
  try {
    await upsertCrmSector({
      id: sector.id,
      name: sector.name,
      icon: sector.icon,
      color: sector.color,
      budget_limit: sector.budgetLimit,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
