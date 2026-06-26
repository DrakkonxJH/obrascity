import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import CRMBoard from "@/components/crm/CRMBoard";
import { getCRMData } from "@/app/actions/crmActions";

export const dynamic = "force-dynamic";

export default async function CrmWorkspacePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getCRMData();

  if (!data.success) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-void">
        <p>Erro ao carregar dados do CRM: {data.error}</p>
      </div>
    );
  }

  return <CRMBoard initialCards={data.cards} initialWorkflow={data.workflow} initialSectors={data.sectors} />;
}
