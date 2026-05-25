import type { ProfileRole } from "@/lib/auth/roles";

const ROLE_APPROVAL_LIMIT: Record<ProfileRole, number> = {
  master: Number.POSITIVE_INFINITY,
  administrador: Number.POSITIVE_INFINITY,
  gestor: 50_000,
  engenheiro: 20_000,
  tecnico: 5_000,
  visualizador: 0,
};

const APPROVAL_CHAIN: ProfileRole[] = ["visualizador", "tecnico", "engenheiro", "gestor", "administrador", "master"];

export function getRoleApprovalLimit(role: ProfileRole) {
  return ROLE_APPROVAL_LIMIT[role];
}

export function resolveRequiredRoleByAmount(amount: number): ProfileRole {
  if (!Number.isFinite(amount) || amount <= 0) return "tecnico";
  if (amount <= ROLE_APPROVAL_LIMIT.tecnico) return "tecnico";
  if (amount <= ROLE_APPROVAL_LIMIT.engenheiro) return "engenheiro";
  if (amount <= ROLE_APPROVAL_LIMIT.gestor) return "gestor";
  return "administrador";
}

export function requiresApprovalForAmount(role: ProfileRole, amount: number) {
  return amount > getRoleApprovalLimit(role);
}

export function canApproveForRole(approver: ProfileRole, required: ProfileRole) {
  return APPROVAL_CHAIN.indexOf(approver) >= APPROVAL_CHAIN.indexOf(required);
}
