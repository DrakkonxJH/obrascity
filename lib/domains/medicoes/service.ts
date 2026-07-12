import { IMedicoesRepository } from "./repository";
import { MedicaoItem, CreateMedicaoInput, EvmIndicadores } from "./entities";
import { logDomainError, logInfraError } from "@/lib/observability/logger";
import { ensureObraAtiva, listObras } from "@/lib/db/obras";

export type MedicoesServiceDeps = {
  getEmpresaId: () => Promise<string>;
  listObras: () => Promise<any[]>;
  ensureObraAtiva: (obraId: string) => Promise<void>;
};

export class MedicoesService {
  constructor(
    private repository: IMedicoesRepository,
    private deps: MedicoesServiceDeps
  ) {}

  async listMedicoes(activeObraIds: Set<string>): Promise<MedicaoItem[]> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const data = await this.repository.listMedicoes(empresaId);

      return data
        .filter((item) => activeObraIds.has(item.obra_id as string))
        .map((item) => ({
          id: item.id as string,
          obraId: item.obra_id as string,
          obraNome: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
          referencia: item.referencia as string,
          valor: Number(item.valor ?? 0),
          retencao: Number(item.retencao ?? 0),
          aditivo: Number(item.aditivo ?? 0),
          status: item.status as string,
        }));
    } catch (error: any) {
      logInfraError(error, { action: "listMedicoes" });
      throw error;
    }
  }

  async createMedicao(input: CreateMedicaoInput): Promise<string> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      await this.deps.ensureObraAtiva(input.obraId);
      const result = await this.repository.createMedicao(empresaId, input);
      return result.id;
    } catch (error: any) {
      logDomainError(error, { action: "createMedicao", input });
      throw error;
    }
  }

  async getEvmIndicadores(): Promise<EvmIndicadores> {
    try {
      const empresaId = await this.deps.getEmpresaId();
      const [financeiro, obrasAtivas] = await Promise.all([
        this.repository.getFinanceiroResumo(empresaId),
        this.deps.listObras(),
      ]);

      const pv = (financeiro ?? []).reduce((acc, row) => acc + Number(row.orcado ?? 0), 0);
      const ac = (financeiro ?? []).reduce((acc, row) => acc + Number(row.realizado ?? 0), 0);
      const progressoMedio =
        obrasAtivas.length > 0
          ? obrasAtivas.reduce((acc, row) => acc + Number((row as any).progresso ?? 0), 0) / obrasAtivas.length
          : 0;
      const ev = pv * (progressoMedio / 100);

      const cpi = ac > 0 ? ev / ac : 0;
      const spi = pv > 0 ? ev / pv : 0;
      const eac = cpi > 0 ? pv / cpi : pv;

      return { pv, ev, ac, cpi, spi, eac };
    } catch (error: any) {
      logInfraError(error, { action: "getEvmIndicadores" });
      throw error;
    }
  }
}
