import { IObrasRepository } from "./repository";
import { Obra, ObraTrashItem, CreateObraInput, UpdateObraInput, DashboardResumo } from "./entities";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { logDomainError, logInfraError } from "@/lib/observability/logger";

export type ObrasServiceDeps = {
  getEmpresaId: () => Promise<string>;
};

export class ObrasService {
  constructor(
    private repository: IObrasRepository,
    private deps: ObrasServiceDeps
  ) {}

  async supportsTrash(): Promise<boolean> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.supportsTrash(empresaId);
    } catch (error: any) {
      logInfraError(error, { action: "supportsTrash" });
      return false;
    }
  }

  async listObras(): Promise<Obra[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.listActive(empresaId);
    } catch (error: any) {
      logInfraError(error, { action: "listObras" });
      throw error;
    }
  }

  async listObrasTrash(): Promise<ObraTrashItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.listTrash(empresaId);
    } catch (error: any) {
      logInfraError(error, { action: "listObrasTrash" });
      throw error;
    }
  }

  async ensureObraAtiva(obraId: string): Promise<Obra> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const obra = await this.repository.findOneActive(empresaId, obraId);
      if (!obra) {
        throw new Error("Obra não encontrada ou está na lixeira");
      }
      return obra;
    } catch (error: any) {
      logDomainError(error, { action: "ensureObraAtiva", obraId });
      throw error;
    }
  }

  async softDeleteObra(obraId: string, deletedBy: string): Promise<void> {
    try {
      const trashEnabled = await this.supportsTrash();
      if (!trashEnabled) {
        throw new Error("Lixeira indisponível até aplicar a migration 0014");
      }
      const empresaId = await this.deps.getEmpresaId();
      const success = await this.repository.softDelete(empresaId, obraId, deletedBy);
      if (!success) throw new Error("Erro ao mover obra para lixeira: obra não encontrada");
    } catch (error: any) {
      logDomainError(error, { action: "softDeleteObra", obraId });
      throw error;
    }
  }

  async restoreObra(obraId: string): Promise<void> {
    try {
      const trashEnabled = await this.supportsTrash();
      if (!trashEnabled) {
        throw new Error("Lixeira indisponível até aplicar a migration 0014");
      }
      const empresaId = await this.deps.getEmpresaId();
      const success = await this.repository.restore(empresaId, obraId);
      if (!success) throw new Error("Erro ao restaurar obra: obra não encontrada");
    } catch (error: any) {
      logDomainError(error, { action: "restoreObra", obraId });
      throw error;
    }
  }

  async createObra(input: CreateObraInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const trashEnabled = await this.supportsTrash();
      await this.repository.create(empresaId, input, trashEnabled);
    } catch (error: any) {
      logDomainError(error, { action: "createObra", input });
      throw error;
    }
  }

  async updateObra(obraId: string, input: UpdateObraInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const trashEnabled = await this.supportsTrash();
      const success = await this.repository.update(empresaId, obraId, input, trashEnabled);
      if (!success) throw new Error("Erro ao atualizar obra: obra não encontrada");
    } catch (error: any) {
      logDomainError(error, { action: "updateObra", obraId });
      throw error;
    }
  }

  async getDashboardResumo(): Promise<DashboardResumo> {
    try {
      const obras = await this.listObras();
      return {
        total: obras.length,
        atencao: obras.filter((o) => o.status === "atencao").length,
        andamento: obras.filter((o) => o.status === "andamento").length,
        concluidas: obras.filter((o) => o.status === "concluida").length,
      };
    } catch (error: any) {
      logInfraError(error, { action: "getDashboardResumo" });
      throw error;
    }
  }
}
