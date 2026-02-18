import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { matterId } = await params;

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, firmId: user.firmId },
  });

  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const directions = await prisma.direction.findMany({
    where: { matterId },
    include: {
      sourceDocument: {
        select: { id: true, fileName: true },
      },
    },
    orderBy: [{ status: "asc" }, { orderNumber: "asc" }],
  });

  return NextResponse.json(directions);
}
