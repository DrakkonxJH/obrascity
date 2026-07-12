import { createServerClient } from "@/lib/supabase/server";
import { SupabaseObrasRepository } from "./repository";
import { ObrasService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export async function getObrasService(): Promise<ObrasService> {
  const supabase = await createServerClient();
  const repository = new SupabaseObrasRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
  };
  return new ObrasService(repository, deps);
}
