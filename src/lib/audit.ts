import { NextRequest } from "next/server";
import { AuditAction } from "@/generated/prisma";
import { prisma } from "./prisma";

interface AuditLogParams {
  firmId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  req?: NextRequest;
}

export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        firmId: params.firmId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
        newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
        ipAddress: params.req?.headers.get("x-forwarded-for") ?? params.req?.headers.get("x-real-ip") ?? null,
        userAgent: params.req?.headers.get("user-agent") ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
