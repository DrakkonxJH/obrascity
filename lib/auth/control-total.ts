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
  if (String(profile.role ?? "").trim().toLowerCase() !== "master") return false;

  const ownerId = String(process.env.CONTROLE_TOTAL_OWNER_PROFILE_ID ?? "").trim();
  const ownerEmail = normalizeEmail(process.env.CONTROLE_TOTAL_OWNER_EMAIL);
  const profileId = String(profile.id ?? "").trim();
  const profileEmail = normalizeEmail(profile.email);
  const hasOwnerBinding = Boolean(ownerId || ownerEmail);

  // Ambiente sem binding explícito (ex: localhost): qualquer role master entra no modo Controle Total.
  if (!hasOwnerBinding) return true;

  if (ownerId && profileId && ownerId === profileId) return true;
  if (ownerEmail && profileEmail && ownerEmail === profileEmail) return true;

  return false;
}
