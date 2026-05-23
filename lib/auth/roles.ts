export const PROFILE_ROLE_OPTIONS = [
  "master",
  "administrador",
  "gestor",
  "engenheiro",
  "tecnico",
  "visualizador",
] as const;

export type ProfileRole = (typeof PROFILE_ROLE_OPTIONS)[number];

export const PROFILE_ROLE_LABEL: Record<ProfileRole, string> = {
  master: "Master",
  administrador: "Administrador",
  gestor: "Gestor",
  engenheiro: "Engenheiro",
  tecnico: "Tecnico",
  visualizador: "Usuario",
};

export const ASSIGNABLE_PROFILE_ROLE_OPTIONS = PROFILE_ROLE_OPTIONS.filter(
  (role): role is Exclude<ProfileRole, "master"> => role !== "master",
);

export function isProfileRole(value: string): value is ProfileRole {
  return PROFILE_ROLE_OPTIONS.includes(value as ProfileRole);
}

export function isAssignableProfileRole(value: string): value is Exclude<ProfileRole, "master"> {
  return ASSIGNABLE_PROFILE_ROLE_OPTIONS.includes(value as Exclude<ProfileRole, "master">);
}
