import { getCronogramaService } from "@/lib/domains/cronograma";
import {
  CronogramaItem,
  CronogramaDependencia,
  ReplanejamentoItem,
  CaminhoCriticoItem,
  CronogramaBaselineLatestItem
} from "@/lib/domains/cronograma/entities";

export type CronogramaItemLegacy = CronogramaItem;
export type CronogramaDependenciaLegacy = CronogramaDependencia;
export type ReplanejamentoItemLegacy = ReplanejamentoItem;
export type CaminhoCriticoItemLegacy = CaminhoCriticoItem;
export type CronogramaBaselineLatestItemLegacy = CronogramaBaselineLatestItem;

export async function listCronograma(): Promise<CronogramaItemLegacy[]> {
  const service = await getCronogramaService();
  return service.listCronograma();
}

export async function createCronogramaItem(input: {
  obra_id: string;
  nome: string;
  inicio: string;
  fim: string;
  status?: string;
}) {
  const service = await getCronogramaService();
  return service.createTarefa({
    obraId: input.obra_id,
    nome: input.nome,
    inicio: input.inicio,
    fim: input.fim,
    status: input.status,
  });
}

export async function updateCronogramaItem(input: {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  status: string;
}) {
  const service = await getCronogramaService();
  return service.updateTarefa({
    id: input.id,
    nome: input.nome,
    inicio: input.inicio,
    fim: input.fim,
    status: input.status,
  });
}

export async function deleteCronogramaItem(id: string) {
  const service = await getCronogramaService();
  await service.deleteTarefa(id);
}

export async function listDependenciasCronograma(): Promise<CronogramaDependenciaLegacy[]> {
  const service = await getCronogramaService();
  return service.listDependencias();
}

export async function createDependenciaCronograma(input: {
  tarefa_predecessora_id: string;
  tarefa_sucessora_id: string;
  tipo?: string;
}) {
  const service = await getCronogramaService();
  await service.createDependencia({
    tarefaPredecessoraId: input.tarefa_predecessora_id,
    tarefaSucessoraId: input.tarefa_sucessora_id,
    tipo: input.tipo,
  });
}

export async function snapshotBaseline(obraId: string) {
  const service = await getCronogramaService();
  await service.snapshotBaseline(obraId);
}

export async function listReplanejamentos(): Promise<ReplanejamentoItemLegacy[]> {
  const service = await getCronogramaService();
  return service.listReplanejamentos();
}

export async function createReplanejamento(input: {
  obra_id: string;
  motivo: string;
  impacto_prazo_dias: number;
  impacto_custo: number;
  status?: string;
}) {
  const service = await getCronogramaService();
  return service.createReplanejamento({
    obraId: input.obra_id,
    motivo: input.motivo,
    impactoPrazoDias: input.impacto_prazo_dias,
    impactoCusto: input.impacto_custo,
    status: input.status,
  });
}

export async function listCaminhoCritico(): Promise<CaminhoCriticoItemLegacy[]> {
  const service = await getCronogramaService();
  return service.listCaminhoCritico();
}

export async function listLatestBaseline(): Promise<CronogramaBaselineLatestItemLegacy[]> {
  const service = await getCronogramaService();
  return service.listLatestBaseline();
}
