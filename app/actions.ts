"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const empresaId = await getEmpresaIdFromProfile();
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", notificationId)
      .eq("empresa_id", empresaId);

    if (error) {
      throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
    }

    revalidatePath("/(app)");
    return { success: true };
  } catch (error) {
    console.error("markNotificationAsReadAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const empresaId = await getEmpresaIdFromProfile();
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("empresa_id", empresaId)
      .eq("lida", false);

    if (error) {
      throw new Error(`Erro ao marcar notificações como lidas: ${error.message}`);
    }

    revalidatePath("/(app)");
    return { success: true };
  } catch (error) {
    console.error("markAllNotificationsAsReadAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}
