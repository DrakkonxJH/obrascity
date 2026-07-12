import { createServerClient } from "@/lib/supabase/server";
import { SupabaseEquipesRepository } from "./repository";
import { EquipesService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export async function getEquipesService(): Promise<EquipesService> {
  const supabase = await createServerClient();
  const repository = new SupabaseEquipesRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
  };
  return new EquipesService(repository, deps);
}
