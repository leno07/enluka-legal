import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { auditLog } from "@/lib/audit";
import { hasMinRole } from "@/lib/roles";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ matterId: string; directionId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  if (!hasMinRole(user.role, "SOLICITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matterId, directionId } = await params;

  const direction = await prisma.direction.findFirst({
    where: {
      id: directionId,
      matterId,
      matter: { firmId: user.firmId },
    },
  });

  if (!direction) {
    return NextResponse.json(
      { error: "Direction not found" },
      { status: 404 }
    );
  }

  if (direction.status === "CONFIRMED") {
    return NextResponse.json(
      { error: "Direction already confirmed" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update direction status
    const confirmed = await tx.direction.update({
      where: { id: directionId },
      data: {
        status: "CONFIRMED",
        confirmedById: user.id,
        confirmedAt: new Date(),
      },
    });

    // Create calendar event if direction has a due date
    let calendarEvent = null;
    if (direction.dueDate) {
      calendarEvent = await tx.calendarEvent.create({
        data: {
          matterId,
          directionId,
          title: direction.title,
          description: direction.description,
          startDate: direction.dueDate,
          isAllDay: true,
          isDeadline: true,
        },
      });
    }

    return { confirmed, calendarEvent };
  });

  await auditLog({
    firmId: user.firmId,
    userId: user.id,
    action: "CONFIRM",
    entityType: "Direction",
    entityId: directionId,
    oldValue: { status: direction.status },
    newValue: {
      status: "CONFIRMED",
      calendarEventId: result.calendarEvent?.id,
    },
    req,
  });

  return NextResponse.json({
    direction: result.confirmed,
    calendarEvent: result.calendarEvent,
  });
}
