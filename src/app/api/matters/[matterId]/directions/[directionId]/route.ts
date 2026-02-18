import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const updateDirectionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "CONFIRMED", "AMENDED", "VACATED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string; directionId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId, directionId } = await params;

  try {
    const body = await req.json();
    const validated = updateDirectionSchema.parse(body);

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

    const updateData: any = { ...validated };
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }

    const updated = await prisma.direction.update({
      where: { id: directionId },
      data: updateData,
    });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Direction",
      entityId: directionId,
      oldValue: direction,
      newValue: updated,
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
    console.error("Update direction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
