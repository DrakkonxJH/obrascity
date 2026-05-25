"use server";

import { revalidatePath } from "next/cache";
import { createPortalShare, revokePortalShare } from "@/lib/db/portal-shares";

export async function createPortalShareAction(formData: FormData) {
  const descricao = String(formData.get("descricao") ?? "").trim();
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;
  const obra_ids = formData
    .getAll("obra_ids")
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  await createPortalShare({
    descricao,
    expires_at,
    obra_ids,
  });

  revalidatePath("/portal");
}

export async function revokePortalShareAction(formData: FormData) {
  const shareId = String(formData.get("share_id") ?? "").trim();
  if (!shareId) {
    throw new Error("Link do portal inválido");
  }

  await revokePortalShare(shareId);
  revalidatePath("/portal");
}
