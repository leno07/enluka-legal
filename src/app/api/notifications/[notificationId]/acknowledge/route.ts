import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const acknowledgeSchema = z.object({
  status: z.enum(["REVIEWED", "IN_PROGRESS", "FILED", "DISMISSED"]),
  note: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { notificationId } = await params;

  try {
    const body = await req.json();
    const validated = acknowledgeSchema.parse(body);

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
      include: { acknowledgement: true },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Mark notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    // Update or create acknowledgement
    const acknowledgement = notification.acknowledgement
      ? await prisma.acknowledgement.update({
          where: { id: notification.acknowledgement.id },
          data: {
            status: validated.status,
            note: validated.note || null,
            acknowledgedAt: new Date(),
          },
        })
      : await prisma.acknowledgement.create({
          data: {
            notificationId,
            userId: user.id,
            status: validated.status,
            note: validated.note || null,
            acknowledgedAt: new Date(),
          },
        });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "ACKNOWLEDGE",
      entityType: "Notification",
      entityId: notificationId,
      newValue: { status: validated.status },
      req,
    });

    return NextResponse.json(acknowledgement);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Acknowledge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
