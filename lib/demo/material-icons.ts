const icons = ["🧱", "⚙️", "🪵", "🎨", "🔩", "🧪", "📦", "🏗️"];

export function materialIcon(name: string, index: number) {
  const lower = name.toLowerCase();
  if (lower.includes("cimento")) return "🧱";
  if (lower.includes("aço") || lower.includes("aco")) return "⚙️";
  if (lower.includes("tijolo")) return "🪵";
  if (lower.includes("tinta")) return "🎨";
  if (lower.includes("areia")) return "🏖️";
  return icons[index % icons.length];
}
