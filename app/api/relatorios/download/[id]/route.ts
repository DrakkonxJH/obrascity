import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeFormat(value: string) {
  const format = value.trim().toLowerCase();
  if (format === "excel") return "xlsx";
  if (format === "doc") return "docx";
  return format || "pdf";
}

function buildFileName(tipo: string, format: string, id: string) {
  const cleanType = tipo.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `relatorio-${cleanType || "obra"}-${id}.${format}`;
}

function jsonResponseAsFile(payload: unknown, fileName: string) {
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvResponseAsFile(csv: string, fileName: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const empresaId = await getEmpresaIdFromProfile();
  const { id } = await context.params;
  const supabase = await createServerClient();

  const { data: report, error: reportError } = await supabase
    .from("relatorios")
    .select("id, empresa_id, obra_id, tipo, formato, status, storage_bucket, storage_path, created_at")
    .eq("empresa_id", empresaId)
    .eq("id", id)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const tipo = String(report.tipo ?? "progresso").trim().toLowerCase();
  const formato = normalizeFormat(String(report.formato ?? "pdf"));
  const obraId = (report.obra_id as string | null) ?? null;
  const fileName = buildFileName(tipo, formato === "xlsx" ? "csv" : formato, id);
  const storageBucket = (report.storage_bucket as string | null) ?? null;
  const storagePath = (report.storage_path as string | null) ?? null;

  if (report.status === "concluido" && storageBucket && storagePath) {
    const admin = createAdminClient();
    const signed = await admin.storage.from(storageBucket).createSignedUrl(storagePath, 60 * 5);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json(
        { error: `Falha ao gerar URL assinada: ${signed.error?.message ?? "indisponível"}` },
        { status: 500 },
      );
    }
    return NextResponse.redirect(signed.data.signedUrl, 302);
  }

  if (tipo === "financeiro") {
    const { data, error } = await supabase
      .from("obras_financeiro")
      .select("obra_id, categoria, orcado, realizado, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Falha ao montar relatório: ${error.message}` }, { status: 500 });
    }

    const rows = (data ?? []).filter((item) => !obraId || item.obra_id === obraId);
    if (formato === "xlsx") {
      const csv = [
        "obra,categoria,orcado,realizado,saldo",
        ...rows.map((item) => {
          const obraNome = (item.obras as { nome?: string } | null)?.nome ?? "Obra";
          const orcado = Number(item.orcado ?? 0);
          const realizado = Number(item.realizado ?? 0);
          return `${obraNome},${String(item.categoria ?? "")},${orcado},${realizado},${orcado - realizado}`;
        }),
      ].join("\n");
      return csvResponseAsFile(csv, fileName);
    }

    return jsonResponseAsFile(
      {
        tipo: "financeiro",
        generated_at: new Date().toISOString(),
        obra_id: obraId,
        itens: rows.map((item) => ({
          obra: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
          categoria: item.categoria,
          orcado: Number(item.orcado ?? 0),
          realizado: Number(item.realizado ?? 0),
          saldo: Number(item.orcado ?? 0) - Number(item.realizado ?? 0),
        })),
      },
      fileName,
    );
  }

  if (tipo === "diario") {
    const { data, error } = await supabase
      .from("diario_obra")
      .select("obra_id, data_ref, clima, efetivo, ocorrencias, obras(nome)")
      .eq("empresa_id", empresaId)
      .order("data_ref", { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Falha ao montar relatório: ${error.message}` }, { status: 500 });
    }

    const rows = (data ?? []).filter((item) => !obraId || item.obra_id === obraId);
    return jsonResponseAsFile(
      {
        tipo: "diario",
        generated_at: new Date().toISOString(),
        obra_id: obraId,
        registros: rows.map((item) => ({
          obra: (item.obras as { nome?: string } | null)?.nome ?? "Obra",
          data: item.data_ref,
          clima: item.clima ?? null,
          efetivo: Number(item.efetivo ?? 0),
          ocorrencias: item.ocorrencias ?? null,
        })),
      },
      fileName,
    );
  }

  const { data: obras, error: obrasError } = await supabase
    .from("obras")
    .select("id, nome, cliente, status, progresso")
    .eq("empresa_id", empresaId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (obrasError) {
    return NextResponse.json({ error: `Falha ao montar relatório: ${obrasError.message}` }, { status: 500 });
  }

  const filteredObras = (obras ?? []).filter((obra) => !obraId || obra.id === obraId);
  return jsonResponseAsFile(
    {
      tipo,
      generated_at: new Date().toISOString(),
      obra_id: obraId,
      obras: filteredObras,
    },
    fileName,
  );
}
