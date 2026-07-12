import { IEntregaRepository } from "./repository";
import { ComissionamentoItem, EntregaItem, CreateComissionamentoInput, UpsertEntregaInput } from "./entities";

export interface EntregaDeps {
  getEmpresaId: () => Promise<string>;
  isMissingRelation: (errorMessage: string) => boolean;
}

export class EntregaService {
  constructor(
    private repository: IEntregaRepository,
    private deps: EntregaDeps
  ) {}

  async listComissionamento(): Promise<ComissionamentoItem[]> {
    const empresaId = await this.deps.getEmpresaId();
    const data = await this.repository.listComissionamento(empresaId).catch(e => {
      if (this.deps.isMissingRelation(e.message)) {
        console.warn("[entrega] tabela comissionamento_itens ausente, retornando vazio.");
        return [];
      }
      throw e;
    });

    return (data ?? []).map((row) => ({
      id: String(row.id ?? ""),
      obraId: String(row.obra_id ?? ""),
      obraNome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
      sistema: String(row.sistema ?? ""),
      ambiente: String(row.ambiente ?? ""),
      item: String(row.item ?? ""),
      status: String(row.status ?? "pendente"),
      observacao: String(row.observacao ?? ""),
      createdAt: String(row.created_at ?? ""),
    }));
  }

  async createComissionamento(input: CreateComissionamentoInput): Promise<void> {
    const empresaId = await this.deps.getEmpresaId();
    const payload = {
      empresa_id: empresaId,
      obra_id: input.obraId,
      sistema: input.sistema,
      ambiente: input.ambiente,
      item: input.item,
      status: input.status,
      observacao: input.observacao,
    };

    await this.repository.createComissionamento(empresaId, payload).catch(e => {
      if (this.deps.isMissingRelation(e.message)) {
        console.warn("[entrega] tabela comissionamento_itens ausente, retornando sem persistir.");
        return;
      }
      throw new Error(`Erro ao criar item de comissionamento: ${e.message}`);
    });
  }

  async listEntregas(): Promise<EntregaItem[]> {
    const empresaId = await this.deps.getEmpresaId();
    const data = await this.repository.listEntregas(empresaId).catch(e => {
      if (this.deps.isMissingRelation(e.message)) {
        console.warn("[entrega] tabela entregas_obra ausente, retornando vazio.");
        return [];
      }
      throw e;
    });

    return (data ?? []).map((row) => ({
      id: String(row.id ?? ""),
      obraId: String(row.obra_id ?? ""),
      obraNome: ((row.obras as { nome?: string } | null)?.nome ?? "Obra") as string,
      status: String(row.status ?? "preparacao"),
      chavesEntregues: Boolean(row.chaves_entregues),
      dataEntrega: row.data_entrega ? String(row.data_entrega) : null,
      aceiteClienteNome: String(row.aceite_cliente_nome ?? ""),
      observacoes: String(row.observacoes ?? ""),
    }));
  }

  async upsertEntrega(input: UpsertEntregaInput): Promise<void> {
    const empresaId = await this.deps.getEmpresaId();

    if (input.status === "entregue") {
      const pendentes = await this.repository.countPendingComissionamento(empresaId, input.obraId).catch(e => {
        if (this.deps.isMissingRelation(e.message)) return 0;
        throw new Error(`Erro ao validar gate de comissionamento: ${e.message}`);
      });
      if (pendentes > 0) {
        throw new Error(
          `Entrega bloqueada: existem ${pendentes} itens de comissionamento pendentes/reprovados. Finalize o checklist antes de concluir a entrega.`
        );
      }
    }

    const payload = {
      empresa_id: empresaId,
      obra_id: input.obraId,
      status: input.status,
      chaves_entregues: input.chavesEntregues,
      data_entrega: input.dataEntrega,
      aceite_cliente_nome: input.aceiteClienteNome,
      observacoes: input.observacoes,
      updated_at: new Date().toISOString(),
    };

    await this.repository.upsertEntrega(empresaId, payload).catch(e => {
      if (this.deps.isMissingRelation(e.message)) {
        console.warn("[entrega] tabela entregas_obra ausente, retornando sem persistir.");
        return;
      }
      throw new Error(`Erro ao salvar entrega da obra: ${e.message}`);
    });
  }
}
