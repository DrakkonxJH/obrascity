import { createServerClient } from "@/lib/supabase/server";
import { SupabaseCronogramaRepository } from "./repository";
import { CronogramaService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export async function getCronogramaService(): Promise<CronogramaService> {
  const supabase = await createServerClient();
  const repository = new SupabaseCronogramaRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    listObras: async () => {
      const { listObras } = await import("@/lib/db/obras");
      return listObras();
    },
    ensureObraAtiva: async (obraId: string) => {
      const { ensureObraAtiva } = await import("@/lib/db/obras");
      await ensureObraAtiva(obraId);
    },
  };
  return new CronogramaService(repository, deps);
}
