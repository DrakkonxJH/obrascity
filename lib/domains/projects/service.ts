import { IProjectRepository } from "./repository";
import {
  CreateProjetoDocumentoInput,
  CreateProjetoConflitoInput,
  ProjetoDocumento,
  ProjetoConflito
} from "./entities";
import { isMissingRelation } from "@/lib/db/migration-guard";
import { logDomainError, logInfraError } from "@/lib/observability/logger";

export type ProjectServiceDeps = {
  getEmpresaId: () => Promise<string>;
  getCurrentProfile: () => Promise<{ id: string } | null>;
};

export class ProjectService {
  constructor(
    private repository: IProjectRepository,
    private deps: ProjectServiceDeps
  ) {}

  async listDocumentos(): Promise<ProjetoDocumento[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.listDocumentos(empresaId);
    } catch (error: any) {
      logInfraError(error, { action: "listDocumentos" });
      return [];
    }
  }

  async createDocumento(input: CreateProjetoDocumentoInput): Promise<void> {
    try {
      const [empresaId, profile] = await Promise.all([
        this.deps.getEmpresaId(),
        this.deps.getCurrentProfile()
      ]);
      await this.repository.createDocumento(empresaId, profile?.id ?? null, input);
    } catch (error: any) {
      if (isMissingRelation(error.message)) {
        console.warn("[ProjectService] tabela projetos_documentos ausente, retornando sem persistir.");
        return;
      }
      logDomainError(error, { action: "createDocumento", input });
      throw error;
    }
  }

  async listConflitos(): Promise<ProjetoConflito[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.listConflitos(empresaId);
    } catch (error: any) {
      logInfraError(error, { action: "listConflitos" });
      return [];
    }
  }

  async createConflito(input: CreateProjetoConflitoInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.createConflito(empresaId, input);
    } catch (error: any) {
      if (isMissingRelation(error.message)) {
        console.warn("[ProjectService] tabela projetos_conflitos ausente, retornando sem persistir.");
        return;
      }
      logDomainError(error, { action: "createConflito", input });
      throw error;
    }
  }
}
