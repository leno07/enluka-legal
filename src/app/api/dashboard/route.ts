import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeMatters,
    upcomingDeadlines,
    overdueCount,
    completedThisWeek,
    recentMatters,
    pendingNotifications,
    upcomingEvents,
  ] = await Promise.all([
    // Active matters count
    prisma.matter.count({
      where: { firmId: user.firmId, status: "ACTIVE" },
    }),

    // Upcoming deadlines (next 30 days, not completed)
    prisma.calendarEvent.count({
      where: {
        matter: { firmId: user.firmId },
        isDeadline: true,
        completedAt: null,
        startDate: { gte: now, lte: thirtyDaysFromNow },
      },
    }),

    // Overdue (past due, not completed)
    prisma.calendarEvent.count({
      where: {
        matter: { firmId: user.firmId },
        isDeadline: true,
        completedAt: null,
        startDate: { lt: now },
      },
    }),

    // Directions confirmed this week
    prisma.direction.count({
      where: {
        matter: { firmId: user.firmId },
        status: "CONFIRMED",
        confirmedAt: { gte: weekAgo },
      },
    }),

    // 5 most recently updated matters
    prisma.matter.findMany({
      where: { firmId: user.firmId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { directions: true, documents: true } },
      },
    }),

    // Unread notifications count
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),

    // Next 5 upcoming calendar events
    prisma.calendarEvent.findMany({
      where: {
        matter: { firmId: user.firmId },
        isDeadline: true,
        completedAt: null,
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      include: {
        matter: { select: { id: true, reference: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    activeMatters,
    upcomingDeadlines,
    overdueCount,
    completedThisWeek,
    recentMatters,
    pendingNotifications,
    upcomingEvents,
  });
}
