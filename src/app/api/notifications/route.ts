import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") || String(PAGINATION_DEFAULT_LIMIT)))
  );
  const unreadOnly = url.searchParams.get("unread") === "true";

  const where: any = { userId: user.id };
  if (unreadOnly) {
    where.readAt = null;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        calendarEvent: {
          select: {
            id: true,
            title: true,
            startDate: true,
            matter: { select: { id: true, reference: true, title: true } },
          },
        },
        acknowledgement: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({
    data: notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    unreadCount: unreadOnly
      ? total
      : await prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
  });
}
