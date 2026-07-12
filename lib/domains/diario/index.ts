import { createServerClient } from "@/lib/supabase/server";
import { SupabaseDiarioRepository } from "./repository";
import { DiarioService } from "./service";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureObraAtiva, listActiveObraIds } from "@/lib/db/obras";
import { decryptField, encryptField } from "@/lib/security/aes256";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUploadCollection } from "@/lib/security/file-upload";

export async function getDiarioService(): Promise<DiarioService> {
  const supabase = await createServerClient();
  const repository = new SupabaseDiarioRepository(supabase);
  const deps = {
    getEmpresaId: getEmpresaIdFromProfile,
    getCurrentUser: getCurrentUser,
    ensureObraAtiva,
    listActiveObraIds: async () => {
      const ids = await listActiveObraIds();
      return ids;
    },
    decryptField,
    encryptField,
    validateUploadCollection,
    createAdminClient,
  };
  return new DiarioService(repository, deps);
}
