import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/validations/env";

export function createAdminClient() {
  const env = getEnv();
  const serviceKey = env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_KEY não configurada no servidor");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "obrascity-admin",
      },
    },
  });
}
