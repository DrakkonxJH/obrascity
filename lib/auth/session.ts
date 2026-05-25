import { createServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}
