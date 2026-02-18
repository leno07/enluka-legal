"use client";

import { useAuth } from "@/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/api/dashboard"),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your practice
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matters</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">{data?.activeMatters ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Open cases</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">{data?.upcomingDeadlines ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${(data?.overdueCount ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {data?.overdueCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(data?.overdueCount ?? 0) > 0 ? "Require immediate action" : "All deadlines on track"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">{data?.completedThisWeek ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Directions confirmed</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Matters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Matters</CardTitle>
              <CardDescription>Your most recently active cases</CardDescription>
            </div>
            <Link href="/matters" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : data?.recentMatters?.length > 0 ? (
              <div className="space-y-2">
                {data.recentMatters.map((matter: any) => (
                  <Link
                    key={matter.id}
                    href={`/matters/${matter.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {matter.reference}
                        </span>
                        <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[matter.status] || ""}`}>
                          {matter.status}
                        </Badge>
                      </div>
                      <p className="truncate text-sm font-medium mt-0.5">
                        {matter.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground ml-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {matter._count?.directions ?? 0}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No matters yet. Create your first matter to begin tracking court directions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              <CardDescription>Next events requiring attention</CardDescription>
            </div>
            <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1">
              Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : data?.upcomingEvents?.length > 0 ? (
              <div className="space-y-2">
                {data.upcomingEvents.map((event: any) => {
                  const eventDate = new Date(event.startDate);
                  const daysLeft = differenceInDays(eventDate, new Date());
                  const urgencyColor =
                    daysLeft <= 1 ? "bg-red-100 text-red-700 border-red-200" :
                    daysLeft <= 7 ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200";

                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold ${urgencyColor}`}>
                        {daysLeft <= 0 ? "!" : `${daysLeft}d`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.matter?.reference} &middot;{" "}
                          {formatDistanceToNow(eventDate, { addSuffix: true })}
                        </p>
                      </div>
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming deadlines. Confirm court directions to create calendar events.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
