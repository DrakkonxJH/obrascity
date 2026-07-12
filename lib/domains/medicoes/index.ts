import { createServerClient } from "@/lib/supabase/server";
import { SupabaseMedicoesRepository } from "./repository";
import { MedicoesService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export async function getMedicoesService(): Promise<MedicoesService> {
  const supabase = await createServerClient();
  const repository = new SupabaseMedicoesRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    listObras: async () => {
      const { listObras } = await import("@/lib/db/obras");
      return listObras();
    },
    ensureObraAtiva: async (obraId: string) => {
      const { ensureObraAtiva } = await import("@/lib/db/obras");
      return ensureObraAtiva(obraId);
    },
  };
  return new MedicoesService(repository, deps);
}
