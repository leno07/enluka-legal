import { Role } from "@prisma/client";

export const ROLE_HIERARCHY: Record<Role, number> = {
  PARALEGAL: 1,
  TRAINEE: 2,
  SOLICITOR: 3,
  SENIOR_SOLICITOR: 4,
  SUPERVISOR: 5,
  PARTNER: 6,
  COLP: 7,
  ADMIN: 8,
};

export const ROLE_LABELS: Record<Role, string> = {
  PARALEGAL: "Paralegal",
  TRAINEE: "Trainee",
  SOLICITOR: "Solicitor",
  SENIOR_SOLICITOR: "Senior Solicitor",
  SUPERVISOR: "Supervisor",
  PARTNER: "Partner",
  COLP: "COLP",
  ADMIN: "Administrator",
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAtLeastSolicitor(role: Role): boolean {
  return hasMinRole(role, "SOLICITOR");
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageFirm(role: Role): boolean {
  return hasMinRole(role, "PARTNER");
}

export function canViewAuditLog(role: Role): boolean {
  return role === "ADMIN" || role === "COLP";
}
