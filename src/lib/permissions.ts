import { Role } from "@/generated/prisma";
import { hasMinRole } from "./roles";

type Action = "create" | "read" | "update" | "delete" | "manage";

type Resource =
  | "matter"
  | "direction"
  | "document"
  | "bundle"
  | "firm"
  | "firm_member"
  | "escalation_policy"
  | "audit_log"
  | "notification";

const PERMISSION_MATRIX: Record<Resource, Partial<Record<Action, Role>>> = {
  matter: {
    create: "SOLICITOR",
    read: "PARALEGAL",
    update: "SOLICITOR",
    delete: "ADMIN",
  },
  direction: {
    create: "SOLICITOR",
    read: "PARALEGAL",
    update: "SOLICITOR",
    delete: "SOLICITOR",
  },
  document: {
    create: "PARALEGAL",
    read: "PARALEGAL",
    update: "PARALEGAL",
    delete: "SOLICITOR",
  },
  bundle: {
    create: "SOLICITOR",
    read: "PARALEGAL",
    update: "SOLICITOR",
    delete: "SOLICITOR",
  },
  firm: {
    read: "PARALEGAL",
    update: "PARTNER",
    manage: "ADMIN",
  },
  firm_member: {
    create: "PARTNER",
    read: "PARALEGAL",
    update: "PARTNER",
    delete: "ADMIN",
  },
  escalation_policy: {
    create: "ADMIN",
    read: "SUPERVISOR",
    update: "ADMIN",
    delete: "ADMIN",
  },
  audit_log: {
    read: "COLP",
  },
  notification: {
    read: "PARALEGAL",
    update: "PARALEGAL",
  },
};

export function checkPermission(
  userRole: Role,
  resource: Resource,
  action: Action
): boolean {
  const requiredRole = PERMISSION_MATRIX[resource]?.[action];
  if (!requiredRole) return false;
  return hasMinRole(userRole, requiredRole);
}
