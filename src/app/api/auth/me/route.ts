import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      firmId: true,
      supervisorId: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      firm: {
        select: {
          id: true,
          name: true,
          sraNumber: true,
        },
      },
      supervisor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!fullUser || !fullUser.isActive) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(fullUser);
}
