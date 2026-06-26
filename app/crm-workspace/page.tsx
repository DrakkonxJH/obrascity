import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CrmWorkspacePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  redirect("/novo-crm/crm-dashboard.html");
}
