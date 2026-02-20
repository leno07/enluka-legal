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
    keyDatesAll,
    upcomingKeyDates,
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

    // All key dates for summary (not completed)
    prisma.keyDate.findMany({
      where: {
        matter: { firmId: user.firmId },
        completedAt: null,
      },
      select: { id: true, status: true, dueDate: true },
    }),

    // Next 5 upcoming key dates sorted by urgency
    prisma.keyDate.findMany({
      where: {
        matter: { firmId: user.firmId },
        completedAt: null,
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        matter: { select: { id: true, reference: true, title: true } },
        keyDateOwner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  // Compute key dates summary with recalculated statuses
  const keyDatesSummary = { total: 0, onTrack: 0, atRisk: 0, overdue: 0, breached: 0 };
  for (const kd of keyDatesAll) {
    keyDatesSummary.total++;
    const hoursOverdue = (now.getTime() - kd.dueDate.getTime()) / (1000 * 60 * 60);
    if (hoursOverdue >= 48) keyDatesSummary.breached++;
    else if (hoursOverdue > 0) keyDatesSummary.overdue++;
    else {
      const daysUntil = Math.ceil((kd.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 5) keyDatesSummary.atRisk++;
      else keyDatesSummary.onTrack++;
    }
  }

  // Recalculate statuses for upcoming key dates
  const upcomingKeyDatesWithStatus = upcomingKeyDates.map((kd) => {
    const hoursOverdue = (now.getTime() - kd.dueDate.getTime()) / (1000 * 60 * 60);
    let status: string;
    if (hoursOverdue >= 48) status = "BREACH";
    else if (hoursOverdue > 0) status = "OVERDUE";
    else {
      const daysUntil = Math.ceil((kd.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      status = daysUntil <= 5 ? "AT_RISK" : "ON_TRACK";
    }
    return { ...kd, status };
  });

  // Sort by urgency
  const statusOrder: Record<string, number> = { BREACH: 0, OVERDUE: 1, AT_RISK: 2, ON_TRACK: 3 };
  upcomingKeyDatesWithStatus.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return NextResponse.json({
    activeMatters,
    upcomingDeadlines,
    overdueCount,
    completedThisWeek,
    recentMatters,
    pendingNotifications,
    upcomingEvents,
    keyDatesSummary,
    upcomingKeyDates: upcomingKeyDatesWithStatus,
  });
}
