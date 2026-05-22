export const predefinedMaterialNames = [
  "Cimento",
  "Areia",
  "Brita",
  "Pedra",
  "Tijolo",
  "Bloco ceramico",
  "Bloco de concreto",
  "Argamassa",
  "Concreto",
  "Aco CA-50",
  "Aco CA-60",
  "Tela soldada",
  "Madeira",
  "Compensado",
  "Gesso",
  "Drywall",
  "Tinta",
  "Selador",
  "Impermeabilizante",
  "Cal",
  "Cabo eletrico",
  "Disjuntor",
  "Conduite",
  "Tubo PVC",
  "Joelho PVC",
  "Registro",
  "Telha",
  "Laje",
  "Reboco",
  "Revestimento ceramico",
  "Piso ceramico",
  "Porcelanato",
  "Argamassa colante",
  "Rejunte",
  "Ferro galvanizado",
  "Parafuso",
  "Prego",
  "Pia",
  "Louca sanitaria",
  "Massa corrida",
  "Balde",
  "Lixa",
] as const;

export function buildMaterialSuggestions(existingNames: string[]) {
  const normalized = new Set<string>();
  const suggestions: string[] = [];

  for (const name of [...predefinedMaterialNames, ...existingNames]) {
    const value = name.trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (normalized.has(key)) continue;

    normalized.add(key);
    suggestions.push(value);
  }

  return suggestions;
}
