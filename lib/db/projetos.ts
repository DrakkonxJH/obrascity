import { getProjectService } from "@/lib/domains/projects";
import { ProjetoDocumento, ProjetoConflito } from "@/lib/domains/projects/entities";

export type ProjetoDocumentoItem = ProjetoDocumento;
export type ProjetoConflitoItem = ProjetoConflito;

export async function listProjetosDocumentos(): Promise<ProjetoDocumentoItem[]> {
  const service = await getProjectService();
  return service.listDocumentos();
}

export async function createProjetoDocumento(input: {
  obraId: string;
  disciplina: string;
  revisao: string;
  status: string;
  observacoes: string;
}) {
  const service = await getProjectService();
  await service.createDocumento({
    obraId: input.obraId,
    disciplina: input.disciplina,
    revisao: input.revisao,
    status: input.status,
    observacoes: input.observacoes,
  });
}

export async function listProjetosConflitos(): Promise<ProjetoConflitoItem[]> {
  const service = await getProjectService();
  return service.listConflitos();
}

export async function createProjetoConflito(input: {
  obraId: string;
  titulo: string;
  descricao: string;
  severidade: string;
  prazo: string | null;
}) {
  const service = await getProjectService();
  await service.createConflito({
    obraId: input.obraId,
    titulo: input.titulo,
    descricao: input.descricao,
    severidade: input.severidade,
    prazo: input.prazo,
  });
}
