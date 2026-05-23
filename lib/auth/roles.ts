export const PROFILE_ROLE_OPTIONS = [
  "administrador",
  "gestor",
  "engenheiro",
  "tecnico",
  "visualizador",
] as const;

export type ProfileRole = (typeof PROFILE_ROLE_OPTIONS)[number];

export const PROFILE_ROLE_LABEL: Record<ProfileRole, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  engenheiro: "Engenheiro",
  tecnico: "Tecnico",
  visualizador: "Usuario",
};

export function isProfileRole(value: string): value is ProfileRole {
  return PROFILE_ROLE_OPTIONS.includes(value as ProfileRole);
}
