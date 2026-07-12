import { createServerClient } from "@/lib/supabase/server";
import { SupabaseFinanceRepository } from "./repository";
import { FinanceService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { listActiveObraIds } from "@/lib/db/obras";

export async function getFinanceService(): Promise<FinanceService> {
  const supabase = await createServerClient();
  const repository = new SupabaseFinanceRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    listActiveObraIds: async () => {
      return await listActiveObraIds();
    },
  };
  return new FinanceService(repository, deps);
}
