import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/auth";
import { inviteMemberSchema } from "@/lib/validators/auth";
import { auditLog } from "@/lib/audit";
import crypto from "crypto";

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

  const members = await prisma.user.findMany({
    where: { firmId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      supervisorId: true,
      lastLoginAt: true,
      createdAt: true,
      supervisor: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(
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
    const validated = inviteMemberSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Generate a temporary password (user will be invited to set their own)
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(tempPassword);

    const member = await prisma.user.create({
      data: {
        firmId,
        email: validated.email,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role,
        supervisorId: validated.supervisorId || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await auditLog({
      firmId,
      userId: user.id,
      action: "CREATE",
      entityType: "User",
      entityId: member.id,
      newValue: { email: member.email, role: member.role },
      req,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
