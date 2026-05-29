import { listCrmCustomTabs, createCrmCustomTab, updateCrmCustomTab, deleteCrmCustomTab } from "@/lib/db/crm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId") || undefined;
    
    const tabs = await listCrmCustomTabs(workspaceId);
    return Response.json({ success: true, data: tabs });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, workspaceId, color = "#3B82F6", description, filters } = body;

    if (!name) {
      return Response.json({ success: false, error: "Nome é obrigatório" }, { status: 400 });
    }

    const tab = await createCrmCustomTab(name, workspaceId, {
      color,
      description,
      ...filters,
    });
    
    return Response.json({ success: true, data: tab });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
