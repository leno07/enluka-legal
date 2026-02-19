import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { updateKeyDateSchema } from "@/lib/validators/key-date";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; keyDateId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId, keyDateId } = await params;

  // Verify matter belongs to user's firm
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
    select: { id: true },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const existing = await prisma.keyDate.findFirst({
    where: { id: keyDateId, matterId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Key date not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validated = updateKeyDateSchema.parse(body);

    const data: any = {};
    if (validated.title !== undefined) data.title = validated.title;
    if (validated.description !== undefined) data.description = validated.description;
    if (validated.dueDate !== undefined) data.dueDate = new Date(validated.dueDate);
    if (validated.status !== undefined) data.status = validated.status;
    if (validated.keyDateOwnerId !== undefined) data.keyDateOwnerId = validated.keyDateOwnerId;
    if (validated.priority !== undefined) data.priority = validated.priority;
    if (validated.completedAt !== undefined) {
      data.completedAt = validated.completedAt ? new Date(validated.completedAt) : null;
    }

    // If marking as BREACH, set breachedAt
    if (validated.status === "BREACH" && !existing.breachedAt) {
      data.breachedAt = new Date();
    }

    const keyDate = await prisma.keyDate.update({
      where: { id: keyDateId },
      data,
      include: {
        keyDateOwner: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "UPDATE",
      entityType: "KeyDate",
      entityId: keyDateId,
      oldValue: existing,
      newValue: keyDate,
      req,
    });

    return NextResponse.json(keyDate);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update key date error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; keyDateId: string }> }
) {
  const user = requireRole(req, "ADMIN");
  if (user instanceof NextResponse) return user;

  const { matterId, keyDateId } = await params;

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
    select: { id: true },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const existing = await prisma.keyDate.findFirst({
    where: { id: keyDateId, matterId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Key date not found" }, { status: 404 });
  }

  await prisma.keyDate.delete({ where: { id: keyDateId } });

  await auditLog({
    firmId: user.firmId,
    userId: user.id,
    action: "DELETE",
    entityType: "KeyDate",
    entityId: keyDateId,
    oldValue: existing,
    req,
  });

  return NextResponse.json({ success: true });
}
