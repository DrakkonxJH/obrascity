import { createServerClient } from "@/lib/supabase/server";
import { SupabaseEntregaRepository } from "./repository";
import { EntregaService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { isMissingRelation } from "@/lib/db/migration-guard";

export async function getEntregaService(): Promise<EntregaService> {
  const supabase = await createServerClient();
  const repository = new SupabaseEntregaRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    isMissingRelation,
  };
  return new EntregaService(repository, deps);
}
