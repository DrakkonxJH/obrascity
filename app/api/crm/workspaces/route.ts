import { createServerClient } from "@/lib/supabase/server";
import { getEmpresaIdFromProfile } from "@/lib/db";
import { listCrmWorkspaces, createCrmWorkspace, updateCrmWorkspace, deleteCrmWorkspace } from "@/lib/db/crm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspaces = await listCrmWorkspaces();
    return Response.json({ success: true, data: workspaces });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color = "#3B82F6", description } = body;

    if (!name) {
      return Response.json({ success: false, error: "Nome é obrigatório" }, { status: 400 });
    }

    const workspace = await createCrmWorkspace(name, color, description);
    return Response.json({ success: true, data: workspace });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
