import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-middleware";
import { updateMemberSchema } from "@/lib/validators/auth";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string; userId: string }> }
) {
  const user = requireRole(req, "PARTNER", "ADMIN");
  if (user instanceof NextResponse) return user;

  const { firmId, userId } = await params;
  if (user.firmId !== firmId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateMemberSchema.parse(body);

    const target = await prisma.user.findFirst({
      where: { id: userId, firmId },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: validated,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        supervisorId: true,
      },
    });

    await auditLog({
      firmId,
      userId: user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      oldValue: { role: target.role, isActive: target.isActive },
      newValue: { role: updated.role, isActive: updated.isActive },
      req,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string; userId: string }> }
) {
  const user = requireRole(req, "ADMIN");
  if (user instanceof NextResponse) return user;

  const { firmId, userId } = await params;
  if (user.firmId !== firmId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot deactivate yourself" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, firmId },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await auditLog({
    firmId,
    userId: user.id,
    action: "DELETE",
    entityType: "User",
    entityId: userId,
    oldValue: { isActive: true },
    newValue: { isActive: false },
    req,
  });

  return NextResponse.json({ success: true });
}
