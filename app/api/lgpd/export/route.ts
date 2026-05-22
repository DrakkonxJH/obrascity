import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { decryptField } from "@/lib/security/aes256";

export async function GET() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const [privacyRequestsResult, notificacoesResult, diariosResult, profileResult] = await Promise.all([
    supabase
      .from("privacy_requests")
      .select("id, titular_email, tipo, status, observacao, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("notificacoes")
      .select("id, titulo, lida, link, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("diario_obra")
      .select("id, obra_id, data_ref, clima, efetivo, equipamentos, ocorrencias, observacoes_ssma, created_at")
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, nome, email, cargo, role, created_at")
      .eq("id", profile.id)
      .maybeSingle(),
  ]);

  const errors = [
    privacyRequestsResult.error,
    notificacoesResult.error,
    diariosResult.error,
    profileResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json(
      { error: `Falha ao exportar dados LGPD: ${errors.map((e) => e?.message).join(" | ")}` },
      { status: 500 },
    );
  }

  const myEmail = (user.email ?? "").trim().toLowerCase();
  const privacyRequests = (privacyRequestsResult.data ?? [])
    .map((row) => ({
      id: row.id as string,
      titular_email: decryptField((row.titular_email as string | null) ?? "") ?? "",
      tipo: row.tipo as string,
      status: row.status as string,
      observacao: decryptField((row.observacao as string | null) ?? null),
      created_at: row.created_at as string,
    }))
    .filter((row) => row.titular_email.toLowerCase() === myEmail);

  const diarios = (diariosResult.data ?? []).map((row) => ({
    id: row.id as string,
    obra_id: row.obra_id as string,
    data_ref: row.data_ref as string,
    clima: (row.clima as string | null) ?? null,
    efetivo: Number(row.efetivo ?? 0),
    equipamentos: decryptField((row.equipamentos as string | null) ?? null),
    ocorrencias: decryptField((row.ocorrencias as string | null) ?? null),
    observacoes_ssma: decryptField((row.observacoes_ssma as string | null) ?? null),
    created_at: row.created_at as string,
  }));

  const payload = {
    generated_at: new Date().toISOString(),
    titular: profileResult.data,
    notificacoes: notificacoesResult.data ?? [],
    diarios,
    privacy_requests: privacyRequests,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lgpd-export-${profile.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
