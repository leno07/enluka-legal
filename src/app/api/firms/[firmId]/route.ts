import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { firmId } = await params;
  if (user.firmId !== firmId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
    select: {
      id: true,
      name: true,
      sraNumber: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      createdAt: true,
    },
  });

  if (!firm) {
    return NextResponse.json({ error: "Firm not found" }, { status: 404 });
  }

  return NextResponse.json(firm);
}

const updateFirmSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sraNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const user = requireRole(req, "PARTNER", "ADMIN");
  if (user instanceof NextResponse) return user;

  const { firmId } = await params;
  if (user.firmId !== firmId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateFirmSchema.parse(body);

    const oldFirm = await prisma.firm.findUnique({ where: { id: firmId } });
    const firm = await prisma.firm.update({
      where: { id: firmId },
      data: validated,
    });

    await auditLog({
      firmId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Firm",
      entityId: firmId,
      oldValue: oldFirm,
      newValue: firm,
      req,
    });

    return NextResponse.json(firm);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update firm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
