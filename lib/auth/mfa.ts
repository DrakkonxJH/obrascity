import { isControlTotalOwner } from "@/lib/auth/control-total";
import { getTenantSecurityPolicyByEmpresa } from "@/lib/db/seguranca-corporativa";

type MfaProfile = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  empresa_id?: string | null;
};

export type MfaRequirement = {
  required: boolean;
  isMasterOwner: boolean;
  reason: "none" | "master" | "tenant-role";
};

export function sanitizeNextPath(nextPath: string | null | undefined, fallback = "/dashboard") {
  if (typeof nextPath !== "string") return fallback;
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : fallback;
}

export function getPostLoginPath(isMasterOwner: boolean, nextPath: string | null | undefined) {
  return isMasterOwner ? "/contas" : sanitizeNextPath(nextPath);
}

export function buildMfaSetupPath(nextPath: string | null | undefined) {
  const safeNext = sanitizeNextPath(nextPath);
  return `/mfa/setup?next=${encodeURIComponent(safeNext)}`;
}

export function buildMfaChallengePath(nextPath: string | null | undefined) {
  const safeNext = sanitizeNextPath(nextPath);
  return `/mfa/challenge?next=${encodeURIComponent(safeNext)}`;
}

export async function getMfaRequirementForProfile(
  profile: MfaProfile | null | undefined,
): Promise<MfaRequirement> {
  const isMasterOwner = isControlTotalOwner(profile);
  if (isMasterOwner) {
    return {
      required: true,
      isMasterOwner: true,
      reason: "master",
    };
  }

  const empresaId = String(profile?.empresa_id ?? "");
  const role = String(profile?.role ?? "");
  if (!empresaId || !role) {
    return {
      required: false,
      isMasterOwner: false,
      reason: "none",
    };
  }

  const tenantPolicy = await getTenantSecurityPolicyByEmpresa(empresaId);
  if (tenantPolicy.mfa_required_roles.includes(role)) {
    return {
      required: true,
      isMasterOwner: false,
      reason: "tenant-role",
    };
  }

  return {
    required: false,
    isMasterOwner: false,
    reason: "none",
  };
}
