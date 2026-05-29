import { updateCrmCustomTab, deleteCrmCustomTab } from "@/lib/db/crm";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const tab = await updateCrmCustomTab(id, body);
    return Response.json({ success: true, data: tab });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await deleteCrmCustomTab(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
