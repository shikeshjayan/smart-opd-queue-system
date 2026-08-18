import type { UserRole } from "./types/auth.types";

export function matchesAnyRole(role: UserRole | undefined, allowedRoles: readonly UserRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function isAuthorizedRole(role: UserRole | undefined, pathname: string): boolean {
  if (pathname.startsWith("/patient")) return role === "patient";
  if (pathname.startsWith("/doctor")) return role === "doctor";
  if (pathname.startsWith("/hospital-admin")) return role === "hospital_admin";
  if (pathname.startsWith("/district-admin")) return role === "district_admin";
  if (pathname.startsWith("/state-admin")) return role === "state_admin";
  return true;
}