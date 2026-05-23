"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  isAssignableProfileRole,
  PROFILE_ROLE_LABEL,
  type ProfileRole,
} from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/validations/env";
import { createPrivacyRequest } from "@/lib/db/privacy";

export type PrivacyActionState = {
  ok: boolean;
  message: string;
};

const initialState: PrivacyActionState = {
  ok: false,
  message: "",
};

export { initialState as privacyInitialState };

export type AccessActionState = {
  ok: boolean;
  message: string;
};

const accessInitialState: AccessActionState = {
  ok: false,
  message: "",
};

export { accessInitialState };

async function requireAdminContext() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Sessao invalida.");
  }

  const supabase = await createServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, empresa_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.empresa_id) {
    throw new Error("Perfil sem empresa vinculada.");
  }

  if (profile.role !== "administrador") {
    throw new Error("Apenas administrador pode gerenciar perfis da empresa.");
  }

  return {
    userId: profile.id as string,
    empresaId: profile.empresa_id as string,
  };
}

function parseRole(rawRole: FormDataEntryValue | null): Exclude<ProfileRole, "master"> {
  const value = String(rawRole ?? "").trim().toLowerCase();
  if (!isAssignableProfileRole(value)) {
    throw new Error("Papel de acesso invalido.");
  }
  return value as Exclude<ProfileRole, "master">;
}

export async function createPrivacyRequestAction(
  _prev: PrivacyActionState,
  formData: FormData,
): Promise<PrivacyActionState> {
  const tipo = String(formData.get("tipo") ?? "").trim().toLowerCase() as
    | "acesso"
    | "portabilidade"
    | "correcao"
    | "exclusao";
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!["acesso", "portabilidade", "correcao", "exclusao"].includes(tipo)) {
    return { ok: false, message: "Tipo de solicitação LGPD inválido." };
  }

  await createPrivacyRequest({ tipo, observacao });
  revalidatePath("/configuracoes");
  return { ok: true, message: "Solicitação LGPD registrada com sucesso." };
}

export async function inviteFuncionarioAction(
  _prev: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  try {
    const ctx = await requireAdminContext();
    const admin = createAdminClient();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const cargo = String(formData.get("cargo") ?? "").trim();
    const equipeId = String(formData.get("equipe_id") ?? "").trim();
    const role = parseRole(formData.get("role"));

    if (nome.length < 2 || nome.length > 120) {
      return { ok: false, message: "Nome deve ter entre 2 e 120 caracteres." };
    }

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Informe um e-mail valido." };
    }

    const { data: profileByEmail, error: profileByEmailError } = await admin
      .from("profiles")
      .select("id, empresa_id")
      .eq("email", email)
      .maybeSingle();

    if (profileByEmailError) {
      throw new Error(`Nao foi possivel validar o e-mail: ${profileByEmailError.message}`);
    }

    let profileId = profileByEmail?.id ?? null;
    let invitedNow = false;

    if (profileByEmail?.empresa_id && profileByEmail.empresa_id !== ctx.empresaId) {
      return {
        ok: false,
        message: "Este e-mail ja esta vinculado a outra empresa.",
      };
    }

    if (!profileId) {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: `${getAppOrigin()}/auth/callback`,
          data: {
            empresa_id: ctx.empresaId,
            nome,
            role,
            invited_by: ctx.userId,
            source: "empresa_admin_panel",
          },
        },
      );

      if (inviteError) {
        throw new Error(`Falha ao convidar funcionario: ${inviteError.message}`);
      }

      if (!inviteData.user?.id) {
        throw new Error("Convite enviado sem id de usuário. Tente novamente.");
      }

      profileId = inviteData.user.id;
      invitedNow = true;
    }

    const { error: upsertProfileError } = await admin.from("profiles").upsert(
      {
        id: profileId,
        empresa_id: ctx.empresaId,
        nome,
        email,
        cargo: cargo || null,
        role,
      },
      { onConflict: "id" },
    );

    if (upsertProfileError) {
      throw new Error(`Falha ao salvar perfil do funcionario: ${upsertProfileError.message}`);
    }

    if (cargo || equipeId) {
      const { data: membroExistente, error: membroExistenteError } = await admin
        .from("membros")
        .select("id")
        .eq("empresa_id", ctx.empresaId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (membroExistenteError) {
        throw new Error(`Falha ao validar membro existente: ${membroExistenteError.message}`);
      }

      if (membroExistente?.id) {
        const { error: membroUpdateError } = await admin
          .from("membros")
          .update({
            cargo: cargo || null,
            equipe_id: equipeId || null,
          })
          .eq("id", membroExistente.id);

        if (membroUpdateError) {
          throw new Error(`Falha ao atualizar membro: ${membroUpdateError.message}`);
        }
      } else {
        const { error: membroInsertError } = await admin.from("membros").insert({
          empresa_id: ctx.empresaId,
          profile_id: profileId,
          cargo: cargo || null,
          equipe_id: equipeId || null,
        });

        if (membroInsertError) {
          throw new Error(`Falha ao criar membro: ${membroInsertError.message}`);
        }
      }
    }

    revalidatePath("/configuracoes");
    revalidatePath("/equipes");
    return {
      ok: true,
      message: invitedNow
        ? "Funcionario convidado com sucesso. Ele recebera um e-mail para criar acesso."
        : "Perfil atualizado com sucesso para este funcionario.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao convidar funcionario.";
    return { ok: false, message };
  }
}

export async function updateFuncionarioRoleAction(
  _prev: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  try {
    const ctx = await requireAdminContext();
    const targetProfileId = String(formData.get("profile_id") ?? "").trim();
    const role = parseRole(formData.get("role"));

    if (!targetProfileId) {
      return { ok: false, message: "Funcionario invalido." };
    }

    if (targetProfileId === ctx.userId) {
      return {
        ok: false,
        message: "Por segurança, altere seu proprio papel apenas via suporte interno.",
      };
    }

    const supabase = await createServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", targetProfileId)
      .eq("empresa_id", ctx.empresaId);

    if (error) {
      throw new Error(`Falha ao atualizar papel: ${error.message}`);
    }

    revalidatePath("/configuracoes");
    return {
      ok: true,
      message: `Papel atualizado para ${PROFILE_ROLE_LABEL[role]}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar papel do funcionario.";
    return { ok: false, message };
  }
}
