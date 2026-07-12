import { ICronogramaRepository } from "./repository";
import {
  CronogramaItem,
  CronogramaDependencia,
  ReplanejamentoItem,
  CaminhoCriticoItem,
  CronogramaBaselineItem,
  CreateTarefaInput,
  UpdateTarefaInput,
  CreateDependenciaInput,
  CreateReplanejamentoInput
} from "./entities";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listObras } from "@/lib/db/obras";
import { logDomainError, logInfraError } from "@/lib/observability/logger";

export type CronogramaServiceDeps = {
  getEmpresaId: () => Promise<string>;
  listObras: () => Promise<any[]>;
  ensureObraAtiva: (obraId: string) => Promise<void>;
};

export class CronogramaService {
  constructor(
    private repository: ICronogramaRepository,
    private deps: CronogramaServiceDeps
  ) {}

  async listCronograma(): Promise<CronogramaItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const obrasAtivas = await this.deps.listObras();
      const activeObraIds = new Set(obrasAtivas.map((o) => o.id));
      const obraNomeById = new Map(obrasAtivas.map((o) => [o.id, o.nome]));

      const sourceRows = await this.repository.listTarefas(empresaId);

      const activeRows = activeObraIds.size > 0
        ? sourceRows.filter((item) => activeObraIds.has(String(item.obra_id ?? "")))
        : sourceRows;

      const rowsToMap = activeRows.length > 0 ? activeRows : sourceRows;

      return rowsToMap.map((item) => ({
        id: item.id as string,
        obraId: item.obra_id as string,
        obraNome: String(
          (item.obras as { nome?: string } | null)?.nome ??
          obraNomeById.get(String(item.obra_id ?? "")) ??
          "Obra sem nome",
        ),
        nome: item.nome as string,
        inicio: item.inicio as string,
        fim: item.fim as string,
        status: item.status as string,
        updatedAt: item.updated_at ? String(item.updated_at) : null,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listCronograma" });
      throw error;
    }
  }

  async createTarefa(input: CreateTarefaInput): Promise<string> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.deps.ensureObraAtiva(input.obraId);
      const result = await this.repository.createTarefa(empresaId, input);
      return result.id;
    } catch (error: any) {
      logDomainError(error, { action: "createTarefa", input });
      throw error;
    }
  }

  async updateTarefa(input: UpdateTarefaInput): Promise<{ id: string; obraId: string }> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const result = await this.repository.updateTarefa(empresaId, input);
      return result;
    } catch (error: any) {
      logDomainError(error, { action: "updateTarefa", input });
      throw error;
    }
  }

  async deleteTarefa(id: string): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.deleteTarefa(empresaId, id);
    } catch (error: any) {
      logDomainError(error, { action: "deleteTarefa", id });
      throw error;
    }
  }

  async listDependencias(): Promise<CronogramaDependencia[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listDependencias(empresaId);
      return data.map(d => ({
        id: d.id,
        tarefaPredecessoraId: d.tarefa_predecessora_id,
        tarefaSucessoraId: d.tarefa_sucessora_id,
        tipo: d.tipo,
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listDependencias" });
      return [];
    }
  }

  async createDependencia(input: CreateDependenciaInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.createDependencia(empresaId, input);
    } catch (error: any) {
      logDomainError(error, { action: "createDependencia", input });
      throw error;
    }
  }

  async snapshotBaseline(obraId: string): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await ensureObraAtiva(obraId);

      const obras = await this.repository.listTarefas(empresaId);
      const obraTarefas = obras.filter(t => t.obra_id === obraId);

      const baselines = await this.repository.getLatestBaselines(empresaId);
      const obraBaselines = baselines.filter(b => b.obra_id === obraId);
      const nextVersao = (obraBaselines.length > 0 ? Math.max(...obraBaselines.map(b => b.versao)) : 0) + 1;

      await this.repository.snapshotBaseline(empresaId, obraId, obraTarefas, nextVersao);
    } catch (error: any) {
      logDomainError(error, { action: "snapshotBaseline", obraId });
      throw error;
    }
  }

  async listReplanejamentos(): Promise<ReplanejamentoItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listReplanejamentos(empresaId);
      return data.map(item => ({
        id: String(item.id ?? ""),
        obraId: String(item.obra_id ?? ""),
        obraNome: String((item.obras as { nome?: string } | null)?.nome ?? "Obra"),
        motivo: String(item.motivo ?? ""),
        impactoPrazoDias: Number(item.impacto_prazo_dias ?? 0),
        impactoCusto: Number(item.impacto_custo ?? 0),
        status: String(item.status ?? "pendente"),
        createdAt: String(item.created_at ?? ""),
      }));
    } catch (error: any) {
      logInfraError(error, { action: "listReplanejamentos" });
      return [];
    }
  }

  async createReplanejamento(input: CreateReplanejamentoInput): Promise<string> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.deps.ensureObraAtiva(input.obraId);
      const result = await this.repository.createReplanejamento(empresaId, input);
      return result.id;
    } catch (error: any) {
      logDomainError(error, { action: "createReplanejamento", input });
      throw error;
    }
  }

  async listCaminhoCritico(): Promise<CaminhoCriticoItem[]> {
    try {
      const items = await this.listCronograma();
      const dependencias = await this.listDependencias();

      const depMap = new Map<string, number>();
      for (const dep of dependencias) {
        depMap.set(dep.tarefaSucessoraId, (depMap.get(dep.tarefaSucessoraId) ?? 0) + 1);
      }

      return items
        .map(item => {
          const duracao = Math.max(1, Math.ceil((new Date(item.fim).getTime() - new Date(item.inicio).getTime()) / 86_400_000));
          return {
            tarefaId: item.id,
            obraId: item.obraId,
            obraNome: item.obraNome,
            nome: item.nome,
            inicio: item.inicio,
            fim: item.fim,
            duracaoDias: duracao,
            dependencias: depMap.get(item.id) ?? 0,
          };
        })
        .sort((a, b) => b.duracaoDias - a.duracaoDias || b.dependencias - a.dependencias)
        .slice(0, 15);
    } catch (error: any) {
      logInfraError(error, { action: "listCaminhoCritico" });
      return [];
    }
  }

  async listLatestBaseline(): Promise<CronogramaBaselineItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const activeObras = await listObras();
      const activeObraIds = activeObras.map(o => o.id);

      const allBaselines = await this.repository.getLatestBaselines(empresaId);

      const latestVersionByObra = new Map<string, number>();
      for (const b of allBaselines) {
        if (!activeObraIds.includes(b.obra_id)) continue;
        const currentMax = latestVersionByObra.get(b.obra_id) ?? -1;
        if (b.versao > currentMax) {
          latestVersionByObra.set(b.obra_id, b.versao);
        }
      }

      return allBaselines
        .filter(b => latestVersionByObra.get(b.obra_id) === b.versao)
        .map(b => ({
          tarefaId: b.tarefa_id,
          obraId: b.obra_id,
          baselineInicio: b.baseline_inicio,
          baselineFim: b.baseline_fim,
          versao: b.versao,
        }));
    } catch (error: any) {
      logInfraError(error, { action: "listLatestBaseline" });
      return [];
    }
  }
}
