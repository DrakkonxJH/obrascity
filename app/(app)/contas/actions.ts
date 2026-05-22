"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertControlTotal() {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) {
    throw new Error("Acesso negado");
  }
}

export async function suspenderEmpresaAction(empresaId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update({ status: "suspended" })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao suspender: ${error.message}`);
  revalidatePath("/contas");
}

export async function ativarEmpresaAction(empresaId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update({ status: "trialing" })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao ativar: ${error.message}`);
  revalidatePath("/contas");
}

export async function alterarPlanoAction(empresaId: string, formData: FormData) {
  await assertControlTotal();
  const plano = String(formData.get("plano") ?? "").trim();
  if (!plano) throw new Error("Plano inválido");
  const admin = createAdminClient();
  const { error } = await admin
    .from("assinaturas")
    .update({ plano })
    .eq("empresa_id", empresaId);
  if (error) throw new Error(`Erro ao alterar plano: ${error.message}`);
  revalidatePath("/contas");
}

export async function removerPerfilAction(profileId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) throw new Error(`Erro ao remover usuário: ${error.message}`);
  revalidatePath("/contas");
}

export async function resetarDadosEmpresaAction(empresaId: string) {
  await assertControlTotal();
  const admin = createAdminClient();
  // Remove operational data; keep empresa, profiles, assinatura
  const tables = [
    "diario_obra",
    "nao_conformidades",
    "materiais",
    "membros",
    "equipes",
    "obras",
  ] as const;
  for (const table of tables) {
    await admin.from(table).delete().eq("empresa_id", empresaId);
  }
  revalidatePath("/contas");
}
