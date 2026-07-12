import { createServerClient } from "@/lib/supabase/server";
import { SupabaseMateriaisRepository } from "./repository";
import { MateriaisService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export async function getMateriaisService(): Promise<MateriaisService> {
  const supabase = await createServerClient();
  const repository = new SupabaseMateriaisRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
  };
  return new MateriaisService(repository, deps);
}
