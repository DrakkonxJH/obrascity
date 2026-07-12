import { IEquipesRepository } from "./repository";
import {
  EquipeItem,
  MembroItem,
  CreateEquipeInput,
  CreateMembroInput
} from "./entities";
import { logDomainError, logInfraError } from "@/lib/observability/logger";

export type EquipesServiceDeps = {
  getEmpresaId: () => Promise<string>;
};

export class EquipesService {
  constructor(
    private repository: IEquipesRepository,
    private deps: EquipesServiceDeps
  ) {}

  async listEquipes(): Promise<EquipeItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      return await this.repository.listEquipes(empresaId);
    } catch (error: any) {
      logInfraError(error, { action: "listEquipes" });
      throw error;
    }
  }

  async listMembros(): Promise<MembroItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listMembros(empresaId);
      return data.map((item) => {
        const equipeId = (item.equipe_id as string | null) ?? null;

        return {
          id: item.id as string,
          profileId: (item.profile_id as string | null) ?? null,
          nome: ((item.profiles as { nome?: string } | null)?.nome as string | undefined) ?? null,
          email: ((item.profiles as { email?: string } | null)?.email as string | undefined) ?? null,
          equipeId,
          equipe_id: equipeId,
          cargo: (item.cargo as string | null) ?? null,
          crea: (item.crea as string | null) ?? null,
        };
      });
    } catch (error: any) {
      logInfraError(error, { action: "listMembros" });
      throw error;
    }
  }

  async createEquipe(input: CreateEquipeInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.createEquipe(empresaId, input);
    } catch (error: any) {
      logDomainError(error, { action: "createEquipe", input });
      throw error;
    }
  }

  async createMembro(input: CreateMembroInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.repository.createMembro(empresaId, input);
    } catch (error: any) {
      logDomainError(error, { action: "createMembro", input });
      throw error;
    }
  }
}
