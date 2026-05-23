import { ConfigView } from "@/components/config/config-view";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";
import { listPrivacyRequests } from "@/lib/db/privacy";
import { listEmpresaProfiles } from "@/lib/db/profiles";
import { listEquipes } from "@/lib/db/equipes";
import { isProfileRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [profile, privacyRequests, companyProfiles, equipes] = await Promise.all([
    getCurrentProfile(),
    listPrivacyRequests(12),
    listEmpresaProfiles(),
    listEquipes(),
  ]);
  const supabase = await createServerClient();
  const { data: empresa } = await supabase.from("empresas").select("nome").limit(1).maybeSingle();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const rawRole = String(profile?.role ?? "");
  const userRole = isProfileRole(rawRole) ? rawRole : "visualizador";
  const isMaster = userRole === "master";

  return (
    <ConfigView
      empresaNome={empresa?.nome ?? null}
      supabaseUrl={supabaseUrl}
      isConnected={Boolean(supabaseUrl)}
      userName={profile?.nome ?? profile?.email?.split("@")[0] ?? "Usuário"}
      userEmail={profile?.email ?? ""}
      userRole={userRole}
      isMaster={isMaster}
      companyProfiles={companyProfiles}
      equipes={equipes}
      privacyRequests={privacyRequests}
    />
  );
}
