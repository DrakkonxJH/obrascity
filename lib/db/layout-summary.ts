import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";

export type LayoutSummary = {
  userName: string;
  userRole: string;
  userInitials: string;
  unreadNotifications: number;
  materiaisCriticos: number;
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "OF";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export async function getLayoutSummary(): Promise<LayoutSummary> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const empresaId = await getEmpresaIdFromProfile();
  const supabase = await createServerClient();

  const [profileResult, notifResult, materiaisResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, cargo, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notificacoes")
      .select("id", { head: true, count: "exact" })
      .eq("empresa_id", empresaId)
      .eq("lida", false),
    supabase
      .from("materiais")
      .select("id, quantidade, minimo")
      .eq("empresa_id", empresaId),
  ]);

  if (profileResult.error) {
    throw new Error(`Erro ao carregar perfil: ${profileResult.error.message}`);
  }
  if (notifResult.error) {
    throw new Error(`Erro ao carregar notificacoes: ${notifResult.error.message}`);
  }
  if (materiaisResult.error) {
    throw new Error(`Erro ao carregar materiais: ${materiaisResult.error.message}`);
  }

  const profile = profileResult.data;
  const userName =
    (profile?.nome as string | null) ??
    user.email?.split("@")[0] ??
    "Administrador";
  const userRole =
    (profile?.cargo as string | null) ??
    (profile?.role as string | null) ??
    "Administrador";

  const materiaisCriticos = (materiaisResult.success ? materiaisResult.data : []).filter((item: any) => {
    const quantidade = Number(item.quantidade ?? 0);
    const minimo = Number(item.minimo ?? 0);
    return quantidade <= minimo;
  }).length;

  return {
    userName,
    userRole,
    userInitials: getInitials(userName),
    unreadNotifications: notifResult.count ?? 0,
    materiaisCriticos,
  };
}
