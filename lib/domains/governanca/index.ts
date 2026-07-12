import { createServerClient } from "@/lib/supabase/server";
import { SupabaseGovernancaRepository } from "./repository";
import { GovernancaService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { isMissingRelation } from "@/lib/db/migration-guard";

export async function getGovernancaService(): Promise<GovernancaService> {
  const supabase = await createServerClient();
  const repository = new SupabaseGovernancaRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    isMissingRelation,
  };
  return new GovernancaService(repository, deps);
}
