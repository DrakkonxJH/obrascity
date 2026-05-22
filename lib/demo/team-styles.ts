const teamStyles = [
  { icon: "🏗️", bg: "rgba(59,123,255,.12)", color: "var(--of-blue)", badge: "of-badge-blue" },
  { icon: "⚡", bg: "rgba(31,208,122,.12)", color: "var(--of-green)", badge: "of-badge-green" },
  { icon: "🏛️", bg: "rgba(167,139,250,.12)", color: "var(--of-purple)", badge: "of-badge-purple" },
  { icon: "💧", bg: "rgba(34,211,238,.12)", color: "var(--of-cyan)", badge: "of-badge-cyan" },
  { icon: "📋", bg: "rgba(245,166,35,.12)", color: "var(--of-yellow)", badge: "of-badge-yellow" },
];

const avatarColors = ["#3B7BFF", "#22C97A", "#F5A623", "#A78BFA", "#FF4060", "#22D3EE"];

export function getTeamStyle(index: number) {
  return teamStyles[index % teamStyles.length];
}

export function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

export function initialsFromCargo(cargo: string | null, index: number) {
  if (!cargo) return `P${index + 1}`.slice(0, 2).toUpperCase();
  const parts = cargo.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
