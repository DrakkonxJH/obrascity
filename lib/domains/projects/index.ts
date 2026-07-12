import { createServerClient } from "@/lib/supabase/server";
import { SupabaseProjectRepository } from "./repository";
import { ProjectService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentProfile } from "@/lib/auth/require-profile";

export async function getProjectService(): Promise<ProjectService> {
  const supabase = await createServerClient();
  const repository = new SupabaseProjectRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    getCurrentProfile: getCurrentProfile,
  };
  return new ProjectService(repository, deps);
}
