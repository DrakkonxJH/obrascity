type ProfileLike = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
};

function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function isControlTotalOwner(profile: ProfileLike | null | undefined) {
  if (!profile) return false;

  const ownerId = String(process.env.CONTROLE_TOTAL_OWNER_PROFILE_ID ?? "").trim();
  const ownerEmail = normalizeEmail(process.env.CONTROLE_TOTAL_OWNER_EMAIL);
  const profileId = String(profile.id ?? "").trim();
  const profileEmail = normalizeEmail(profile.email);
  const hasOwnerBinding = Boolean(ownerId || ownerEmail);
  const role = String(profile.role ?? "").trim().toLowerCase();
  const defaultOwnerEmail = "master@obrasflow.com";

  // Com binding explícito, o match de ID/e-mail do owner é a fonte de verdade.
  if (ownerId && profileId && ownerId === profileId) return true;
  if (ownerEmail && profileEmail && ownerEmail === profileEmail) return true;
  if (hasOwnerBinding) return false;

  if (profileEmail === defaultOwnerEmail) return true;

  // Sem binding explícito (ex: localhost), fallback para a role master.
  if (role === "master") return true;

  return false;
}
