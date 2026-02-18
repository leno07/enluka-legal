import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const matterId = url.searchParams.get("matterId");

  const where: any = {
    matter: { firmId: user.firmId },
  };

  if (startDate) {
    where.startDate = { ...(where.startDate || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.startDate = { ...(where.startDate || {}), lte: new Date(endDate) };
  }
  if (matterId) {
    where.matterId = matterId;
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      matter: {
        select: { id: true, reference: true, title: true },
      },
      direction: {
        select: { id: true, title: true, status: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}
