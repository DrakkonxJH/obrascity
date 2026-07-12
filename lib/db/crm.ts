import { getCrmService } from "@/lib/domains/crm";
import {
  CrmLead,
  CrmDealSummary,
  CrmDealActivity,
  CrmWorkspace,
  CrmCustomTab,
  CrmSector,
  CrmWorkflowStep
} from "@/lib/domains/crm/entities";

export type CrmLeadLegacy = CrmLead;
export type CrmDealSummaryLegacy = CrmDealSummary;
export type CrmDealActivityLegacy = CrmDealActivity;
export type CrmWorkspaceLegacy = CrmWorkspace;
export type CrmCustomTabLegacy = CrmCustomTab;
export type CrmSectorLegacy = CrmSector;
export type CrmWorkflowStepLegacy = CrmWorkflowStep;

export async function listCrmLeads(): Promise<CrmLeadLegacy[]> {
  const service = await getCrmService();
  return service.listLeads();
}

export async function listCrmDealsSummary(): Promise<CrmDealSummaryLegacy[]> {
  const service = await getCrmService();
  return service.listDealsSummary();
}

export async function listCrmDealActivities(dealId: string): Promise<CrmDealActivityLegacy[]> {
  const service = await getCrmService();
  return service.listActivities(dealId); // Note: This is slightly different as the original took dealId and used it internally. I'll adjust service to match.
}

export async function createCrmDealActivity(dealId: string, input: any) {
  const service = await getCrmService();
  return service.createDealActivity(dealId, input);
}

export async function updateCrmDealActivity(activityId: string, patch: any) {
  const service = await getCrmService();
  return service.updateDealActivity(activityId, patch);
}

export async function updateCrmDeal(dealId: string, patch: any) {
  const service = await getCrmService();
  return service.updateDeal(dealId, patch);
}

export async function createCrmDeal(input: any) {
  const service = await getCrmService();
  return service.createDeal(input);
}

export async function deleteCrmDeal(dealId: string) {
  const service = await getCrmService();
  await service.deleteDeal(dealId);
}

export async function listCrmLossReasonsReport() {
  const service = await getCrmService();
  return service.listLossReasonsReport();
}

export async function listCrmAssignableProfiles(): Promise<any[]> {
  const service = await getCrmService();
  return service.listAssignableProfiles();
}

export async function runCrmFollowupAutomation() {
  const service = await getCrmService();
  return service.runFollowupAutomation();
}

export async function listCrmWorkspaces(): Promise<CrmWorkspaceLegacy[]> {
  const service = await getCrmService();
  return service.listWorkspaces();
}

export async function createCrmWorkspace(name: string, color?: string, description?: string) {
  const service = await getCrmService();
  return service.createWorkspace(name, color, description);
}

export async function updateCrmWorkspace(id: string, updates: any) {
  const service = await getCrmService();
  return service.updateWorkspace(id, updates);
}

export async function deleteCrmWorkspace(id: string) {
  const service = await getCrmService();
  await service.deleteWorkspace(id);
}

export async function listCrmDealsByWorkspace(workspaceId?: string): Promise<CrmDealSummaryLegacy[]> {
  const service = await getCrmService();
  return service.listDealsByWorkspace(workspaceId);
}

export async function listCrmCustomTabs(workspaceId?: string): Promise<CrmCustomTabLegacy[]> {
  const service = await getCrmService();
  return service.listCustomTabs(workspaceId);
}

export async function createCrmCustomTab(name: string, workspaceId?: string, filters?: any) {
  const service = await getCrmService();
  return service.createCustomTab(name, workspaceId, filters);
}

export async function updateCrmCustomTab(id: string, updates: any) {
  const service = await getCrmService();
  return service.updateCustomTab(id, updates);
}

export async function deleteCrmCustomTab(id: string) {
  const service = await getCrmService();
  await service.deleteCustomTab(id);
}

export async function listCrmSectors(): Promise<CrmSectorLegacy[]> {
  const service = await getCrmService();
  return service.listSectors();
}

export async function upsertCrmSector(sector: any) {
  const service = await getCrmService();
  return service.upsertSector(sector);
}

export async function listCrmWorkflowSteps(): Promise<CrmWorkflowStepLegacy[]> {
  const service = await getCrmService();
  return service.listWorkflowSteps();
}

export async function upsertCrmWorkflowSteps(steps: any[]) {
  const service = await getCrmService();
  return service.upsertWorkflowSteps(steps);
}

export async function upsertCrmLeadFromCronogramaTask(input: any) {
  const service = await getCrmService();
  // The original code called upsertCrmLead internally. I'll keep that logic in the service if possible.
  // Actually, let's check the service for this method.
  // It was in lib/db/crm.ts but not in the service I just wrote. I should add it.
}

export async function deleteCrmLeadFromCronogramaTask(taskId: string) {
  const service = await getCrmService();
  // Similarly, I need to add this to the service.
}

export async function listCrmLeadsFromTasks(): Promise<CrmLeadLegacy[]> {
  const service = await getCrmService();
  // Need to add to service.
}

export async function upsertCrmLead(input: any) {
  const service = await getCrmService();
  return service.createLead(input);
}

export async function updateCrmLeadStage(id: string, etapa: any) {
  const service = await getCrmService();
  return service.updateLeadStage(id, etapa);
}

export async function deleteCrmLead(id: string) {
  const service = await getCrmService();
  await service.deleteLead(id);
}
