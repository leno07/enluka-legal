import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { updateMatterSchema } from "@/lib/validators/matter";
import { auditLog } from "@/lib/audit";

async function getMatterForUser(matterId: string, firmId: string, userId: string) {
  return prisma.matter.findFirst({
    where: {
      id: matterId,
      firmId,
      OR: [
        { ownerId: userId },
        { assignments: { some: { userId } } },
      ],
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  const userSelect = { id: true, firstName: true, lastName: true, email: true, role: true };

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
    include: {
      owner: { select: userSelect },
      matterManager: { select: userSelect },
      matterPartner: { select: userSelect },
      clientPartner: { select: userSelect },
      assignments: {
        include: {
          user: { select: userSelect },
        },
      },
      _count: {
        select: { directions: true, documents: true, bundles: true, calendarEvents: true, keyDates: true },
      },
    },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  return NextResponse.json(matter);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  try {
    const body = await req.json();
    const validated = updateMatterSchema.parse(body);

    const existing = await getMatterForUser(matterId, user.firmId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const matter = await prisma.matter.update({
      where: { id: matterId },
      data: validated,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Matter",
      entityId: matterId,
      oldValue: existing,
      newValue: matter,
      req,
    });

    return NextResponse.json(matter);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update matter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireRole(req, "ADMIN");
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  await prisma.matter.update({
    where: { id: matterId },
    data: { status: "ARCHIVED" },
  });

  await auditLog({
    firmId: user.firmId,
    userId: user.id,
    action: "DELETE",
    entityType: "Matter",
    entityId: matterId,
    oldValue: { status: matter.status },
    newValue: { status: "ARCHIVED" },
    req,
  });

  return NextResponse.json({ success: true });
}
