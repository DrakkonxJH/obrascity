import { getObrasService } from "@/lib/domains/obras";
import type { Obra } from "@/types/domain";
import type { ObraTrashItem } from "@/lib/domains/obras/entities";

export type ObraTrashItemLegacy = ObraTrashItem;

export async function supportsObraTrash() {
  const service = await getObrasService();
  return service.supportsTrash();
}

export async function listObras(): Promise<Obra[]> {
  const service = await getObrasService();
  return service.listObras();
}

export async function listObrasTrash(): Promise<ObraTrashItem[]> {
  const service = await getObrasService();
  return service.listObrasTrash();
}

export async function ensureObraAtiva(obraId: string) {
  const service = await getObrasService();
  return service.ensureObraAtiva(obraId);
}

export async function softDeleteObra(obraId: string, deletedBy: string) {
  const service = await getObrasService();
  await service.softDeleteObra(obraId, deletedBy);
}

export async function restoreObra(obraId: string) {
  const service = await getObrasService();
  await service.restoreObra(obraId);
}

export async function listActiveObraIds() {
  const service = await getObrasService();
  const obras = await service.listObras();
  return new Set(obras.map((obra) => obra.id));
}

export async function createObra(input: {
  nome: string;
  cliente: string;
  status?: Obra["status"];
}) {
  const service = await getObrasService();
  await service.createObra(input);
}

export async function updateObra(
  obraId: string,
  input: {
    nome: string;
    cliente: string;
    status: Obra["status"];
    progresso: number;
  },
) {
  const service = await getObrasService();
  await service.updateObra(obraId, input);
}

export async function getDashboardResumo() {
  const service = await getObrasService();
  return service.getDashboardResumo();
}
