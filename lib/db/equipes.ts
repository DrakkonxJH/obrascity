import { getEquipesService } from "@/lib/domains/equipes";
import { EquipeItem, MembroItem } from "@/lib/domains/equipes/entities";

export type EquipeItemLegacy = EquipeItem;
export type MembroItemLegacy = MembroItem;

export async function listEquipes(): Promise<EquipeItemLegacy[]> {
  const service = await getEquipesService();
  return service.listEquipes();
}

export async function listMembros(): Promise<MembroItemLegacy[]> {
  const service = await getEquipesService();
  return service.listMembros();
}

export async function createMembro(input: {
  cargo: string;
  crea?: string;
  equipe_id?: string;
}) {
  const service = await getEquipesService();
  await service.createMembro({
    cargo: input.cargo,
    crea: input.crea,
    equipeId: input.equipe_id,
  });
}

export async function createEquipe(input: { nome: string; especialidade?: string }) {
  const service = await getEquipesService();
  await service.createEquipe(input);
}
