import { createServerClient } from "@/lib/supabase/server";
import { SupabaseCrmRepository } from "./repository";
import { CrmService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export async function getCrmService(): Promise<CrmService> {
  const supabase = await createServerClient();
  const repository = new SupabaseCrmRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    getCurrentProfile: getCurrentProfile,
  };
  return new CrmService(repository, deps);
}
