import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from "@/lib/constants";
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

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") || String(PAGINATION_DEFAULT_LIMIT)))
  );
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = {
    matter: { firmId: user.firmId },
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { matter: { title: { contains: search, mode: "insensitive" } } },
      { matter: { reference: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [keyDates, total] = await Promise.all([
    prisma.keyDate.findMany({
      where,
      include: {
        matter: {
          select: { id: true, reference: true, title: true },
        },
        keyDateOwner: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.keyDate.count({ where }),
  ]);

  // Auto-update statuses
  const updatedKeyDates = keyDates.map((kd) => {
    const calculatedStatus = calculateKeyDateStatus(kd.dueDate, kd.completedAt);
    return { ...kd, status: kd.completedAt ? kd.status : calculatedStatus };
  });

  // Sort by urgency: BREACH > OVERDUE > AT_RISK > ON_TRACK
  const statusOrder = { BREACH: 0, OVERDUE: 1, AT_RISK: 2, ON_TRACK: 3 };
  updatedKeyDates.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return NextResponse.json({
    data: updatedKeyDates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
