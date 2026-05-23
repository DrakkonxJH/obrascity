import { createAdminClient } from "@/lib/supabase/admin";

export async function provisionTrialTenant(input: {
  userId: string;
  email: string;
  nome: string;
  empresaNome: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("provision_trial_tenant", {
    p_user_id: input.userId,
    p_email: input.email,
    p_nome: input.nome,
    p_empresa_nome: input.empresaNome,
  });

  if (error) {
    throw new Error(`Erro ao provisionar conta trial: ${error.message}`);
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "visualizador" })
    .eq("id", input.userId);

  if (roleError) {
    throw new Error(`Erro ao ajustar perfil cliente: ${roleError.message}`);
  }

  return data as string;
}
