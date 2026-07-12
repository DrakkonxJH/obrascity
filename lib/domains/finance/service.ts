import { IFinanceRepository } from "./repository";
import { FinanceiroItem, FinanceiroInput, FinanceiroUpdateInput } from "./entities";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
import { logDomainError, logInfraError } from "@/lib/observability/logger";

export type FinanceServiceDeps = {
  getEmpresaId: () => Promise<string>;
  listActiveObraIds: () => Promise<Set<string>>;
};

export class FinanceService {
  constructor(
    private repository: IFinanceRepository,
    private deps: FinanceServiceDeps
  ) {}

  async listFinanceiro(): Promise<FinanceiroItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const activeObraIds = await this.deps.listActiveObraIds();
      const data = await this.repository.list(empresaId);

      return data
        .filter((item) => activeObraIds.has(item.obra_id as string))
        .map((item) => ({
          id: item.id as string,
          obraId: item.obra_id as string,
          obraNome: (item.obras as { nome?: string } | null)?.nome ?? "Obra sem nome",
          categoria: item.categoria as string,
          orcado: Number(item.orcado ?? 0),
          realizado: Number(item.realizado ?? 0),
        }));
    } catch (error: any) {
      logInfraError(error, { action: "listFinanceiro" });
      throw error;
    }
  }

  async createFinanceiroItem(input: FinanceiroInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await ensureObraAtiva(input.obraId);
      await this.repository.create(empresaId, input);
    } catch (error: any) {
      logDomainError(error, { action: "createFinanceiroItem", input });
      throw error;
    }
  }

  async updateFinanceiroItem(input: FinanceiroUpdateInput): Promise<void> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await ensureObraAtiva(input.obraId);
      const success = await this.repository.update(empresaId, input);
      if (!success) throw new Error("Lançamento financeiro não encontrado");
    } catch (error: any) {
      logDomainError(error, { action: "updateFinanceiroItem", input });
      throw error;
    }
  }
}
