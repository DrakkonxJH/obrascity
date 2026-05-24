import { redirect } from "next/navigation";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { getCurrentProfile } from "@/lib/auth/require-profile";

type ClientProfile = {
  id: string;
  empresa_id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
};

export class MasterAccountClientAccessError extends Error {
  constructor() {
    super("Conta master não pode acessar módulos de cliente");
    this.name = "MasterAccountClientAccessError";
  }
}

export async function requireClientProfileOrThrow(): Promise<ClientProfile> {
  const profile = await getCurrentProfile();
  if (!profile?.id) {
    throw new Error("Sessao invalida");
  }
  if (isControlTotalOwner(profile)) {
    throw new MasterAccountClientAccessError();
  }
  if (!profile.empresa_id) {
    throw new Error("Perfil sem empresa vinculada");
  }

  return {
    id: String(profile.id),
    empresa_id: String(profile.empresa_id),
    nome: profile.nome ? String(profile.nome) : null,
    email: profile.email ? String(profile.email) : null,
    role: profile.role ? String(profile.role) : null,
  };
}

export async function requireClientProfileForPage(): Promise<ClientProfile> {
  const profile = await getCurrentProfile();
  if (!profile?.id) {
    redirect("/login");
  }
  if (isControlTotalOwner(profile)) {
    redirect("/contas");
  }
  if (!profile.empresa_id) {
    redirect("/conta-pendente");
  }

  return {
    id: String(profile.id),
    empresa_id: String(profile.empresa_id),
    nome: profile.nome ? String(profile.nome) : null,
    email: profile.email ? String(profile.email) : null,
    role: profile.role ? String(profile.role) : null,
  };
}
