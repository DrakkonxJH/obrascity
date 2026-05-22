import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/validations/env";

export async function createServerClient() {
  const env = getEnv();
  const cookieStore = await cookies();

  return createSSRServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            try {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            } catch (error) {
              const message = error instanceof Error ? error.message : "";
              if (!message.includes("Cookies can only be modified")) {
                throw error;
              }
            }
          }
        },
      },
    },
  );
}
