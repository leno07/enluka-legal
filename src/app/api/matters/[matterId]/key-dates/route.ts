import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { createKeyDateSchema } from "@/lib/validators/key-date";
import { auditLog } from "@/lib/audit";
import { differenceInHours, differenceInDays } from "date-fns";

function calculateKeyDateStatus(dueDate: Date, completedAt: Date | null): "ON_TRACK" | "AT_RISK" | "OVERDUE" | "BREACH" {
  if (completedAt) return "ON_TRACK";
  const now = new Date();
  const hoursOverdue = differenceInHours(now, dueDate);
  if (hoursOverdue >= 48) return "BREACH";
  if (hoursOverdue > 0) return "OVERDUE";
  const daysUntil = differenceInDays(dueDate, now);
  if (daysUntil <= 5) return "AT_RISK";
  return "ON_TRACK";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  // Verify matter belongs to user's firm
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
    select: { id: true },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const keyDates = await prisma.keyDate.findMany({
    where: { matterId },
    include: {
      keyDateOwner: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Auto-update statuses based on current time
  const updatedKeyDates = keyDates.map((kd) => {
    const calculatedStatus = calculateKeyDateStatus(kd.dueDate, kd.completedAt);
    return { ...kd, status: kd.completedAt ? kd.status : calculatedStatus };
  });

  return NextResponse.json(updatedKeyDates);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireRole(req, "SOLICITOR", "SENIOR_SOLICITOR", "SUPERVISOR", "PARTNER", "COLP", "ADMIN");
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  // Verify matter belongs to user's firm
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
    select: { id: true },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validated = createKeyDateSchema.parse(body);

    const dueDate = new Date(validated.dueDate);
    const status = calculateKeyDateStatus(dueDate, null);

    const keyDate = await prisma.keyDate.create({
      data: {
        matterId,
        title: validated.title,
        description: validated.description || null,
        dueDate,
        status,
        keyDateOwnerId: validated.keyDateOwnerId,
        priority: validated.priority || "NORMAL",
      },
      include: {
        keyDateOwner: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    await auditLog({
      firmId: user.firmId,
      userId: user.id,
      action: "CREATE",
      entityType: "KeyDate",
      entityId: keyDate.id,
      newValue: { title: keyDate.title, dueDate: keyDate.dueDate, status: keyDate.status },
      req,
    });

    return NextResponse.json(keyDate, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create key date error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
