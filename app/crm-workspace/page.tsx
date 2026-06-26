import { getCurrentUser } from "@/lib/auth/session";
import { getCRMData } from "@/app/actions/crmActions";
import CRMBoard from "@/components/crm/crm-board";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CrmWorkspacePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getCRMData();

  if (!data.success) {
    return (
      <div className="h-screen flex items-center justify-center bg-void text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar CRM</h1>
          <p className="text-muted">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <CRMBoard
      initialCards={data.cards}
      initialWorkflow={data.workflow}
      initialSectors={data.sectors}
    />
  );
}
