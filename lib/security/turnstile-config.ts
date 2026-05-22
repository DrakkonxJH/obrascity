const TURNSTILE_KEY_PATTERN = /^0x[0-9A-Za-z_-]{20,}$/;

function extractTurnstileKey(rawValue: string | null | undefined, prefixes: string[]) {
  if (!rawValue) return null;

  const candidates = rawValue
    .split(/[\s,;]+/)
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  for (const candidate of candidates) {
    const normalized = prefixes.reduce(
      (value, prefix) => value.replace(new RegExp(`^${prefix}=`, "i"), ""),
      candidate,
    );

    if (TURNSTILE_KEY_PATTERN.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function getTurnstileSiteKey(rawValue: string | null | undefined) {
  return extractTurnstileKey(rawValue, ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SITE_KEY"]);
}

export function getTurnstileSecretKey(rawValue: string | null | undefined) {
  return extractTurnstileKey(rawValue, ["TURNSTILE_SECRET_KEY"]);
}
