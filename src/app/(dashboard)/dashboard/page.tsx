"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  CalendarCheck,
  ExternalLink,
  TrendingUp,
  Users,
  Target,
  Filter,
  Mail,
  CalendarPlus,
} from "lucide-react";
import { downloadICS, getGoogleCalendarUrl, getMailtoUrl } from "@/lib/calendar-export";
import { formatDistanceToNow, differenceInDays, differenceInHours, format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const KEY_DATE_STATUS_COLORS: Record<string, string> = {
  BREACH: "bg-red-100 text-red-800 border-red-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  AT_RISK: "bg-amber-50 text-amber-700 border-amber-200",
  ON_TRACK: "bg-green-50 text-green-700 border-green-200",
};

type PanelType = "matters" | "deadlines" | "overdue" | "completed" | "keyDates" | null;

export default function DashboardPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [matterFilter, setMatterFilter] = useState<string>("ALL");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("ALL");
  const [keyDateFilter, setKeyDateFilter] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/api/dashboard"),
    enabled: !!user,
  });

  // Fetch overdue events on demand
  const { data: overdueEvents } = useQuery({
    queryKey: ["overdue-events"],
    queryFn: () => {
      const end = new Date().toISOString();
      return apiFetch(`/api/calendar?endDate=${end}`);
    },
    enabled: activePanel === "overdue",
  });

  // Fetch all matters for active panel
  const { data: allMatters } = useQuery({
    queryKey: ["matters-quick", "ACTIVE"],
    queryFn: () => apiFetch("/api/matters?status=ACTIVE&limit=10"),
    enabled: activePanel === "matters",
  });

  const kdSummary = data?.keyDatesSummary;
  const kdUrgentTotal = (kdSummary?.breached ?? 0) + (kdSummary?.overdue ?? 0);

  const overdue = (overdueEvents || []).filter(
    (e: any) => !e.completedAt
  );

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

      {/* Metric cards — 5 interactive cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-5">
        {/* Active Matters */}
        <Card
          className="border-l-4 border-l-primary cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
          onClick={() => setActivePanel("matters")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Matters</CardTitle>
            <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold">{data?.activeMatters ?? 0}</div>
                <p className="text-[10px] sm:text-xs text-primary/70 mt-1 flex items-center gap-1">
                  Click to view <ExternalLink className="h-2.5 w-2.5" />
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card
          className="border-l-4 border-l-blue-500 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
          onClick={() => setActivePanel("deadlines")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Deadlines</CardTitle>
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold">{data?.upcomingDeadlines ?? 0}</div>
                <p className="text-[10px] sm:text-xs text-blue-500/70 mt-1 flex items-center gap-1">
                  Next 30 days <ExternalLink className="h-2.5 w-2.5" />
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card
          className="border-l-4 border-l-red-500 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
          onClick={() => setActivePanel("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className={`text-2xl sm:text-3xl font-bold ${(data?.overdueCount ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {data?.overdueCount ?? 0}
                </div>
                <p className="text-[10px] sm:text-xs text-red-500/70 mt-1 flex items-center gap-1">
                  {(data?.overdueCount ?? 0) > 0 ? "Action needed" : "All clear"} <ExternalLink className="h-2.5 w-2.5" />
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card
          className="border-l-4 border-l-emerald-500 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
          onClick={() => setActivePanel("completed")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Completed</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold">{data?.completedThisWeek ?? 0}</div>
                <p className="text-[10px] sm:text-xs text-emerald-500/70 mt-1 flex items-center gap-1">
                  This week <ExternalLink className="h-2.5 w-2.5" />
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Key Dates */}
        <Card
          className={`border-l-4 col-span-2 lg:col-span-1 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${kdUrgentTotal > 0 ? "border-l-red-500" : "border-l-teal-500"}`}
          onClick={() => setActivePanel("keyDates")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Key Dates</CardTitle>
            <CalendarCheck className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${kdUrgentTotal > 0 ? "text-red-500" : "text-teal-500"}`} />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className={`text-2xl sm:text-3xl font-bold ${kdUrgentTotal > 0 ? "text-red-600" : ""}`}>
                  {kdSummary?.total ?? 0}
                </div>
                <p className={`text-[10px] sm:text-xs mt-1 flex items-center gap-1 ${kdUrgentTotal > 0 ? "text-red-500/70" : "text-teal-500/70"}`}>
                  {kdUrgentTotal > 0
                    ? `${kdUrgentTotal} need attention`
                    : kdSummary?.atRisk
                      ? `${kdSummary.atRisk} at risk`
                      : "All on track"}{" "}
                  <ExternalLink className="h-2.5 w-2.5" />
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== DETAIL DIALOGS ===== */}

      {/* Active Matters Dialog */}
      <Dialog open={activePanel === "matters"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Active Matters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(allMatters?.data || data?.recentMatters || []).map((matter: any) => (
              <Link
                key={matter.id}
                href={`/matters/${matter.id}`}
                onClick={() => setActivePanel(null)}
                className="flex items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  {matter.owner && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {matter.owner.firstName} {matter.owner.lastName} &middot; {matter._count?.directions ?? 0} directions
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </Link>
            ))}
            {(allMatters?.data || data?.recentMatters || []).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No active matters found.</p>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button className="flex-1" onClick={() => { setActivePanel(null); router.push("/matters"); }}>
              <Briefcase className="mr-2 h-4 w-4" /> View All Matters
            </Button>
            <Button variant="outline" onClick={() => { setActivePanel(null); router.push("/matters/new"); }}>
              + New
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deadlines Dialog */}
      <Dialog open={activePanel === "deadlines"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Deadlines
              <Badge variant="outline" className="text-[10px] ml-auto">{data?.upcomingDeadlines ?? 0} total</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(data?.upcomingEvents || []).map((event: any) => {
              const eventDate = new Date(event.startDate);
              const daysLeft = differenceInDays(eventDate, new Date());
              const urgencyColor =
                daysLeft <= 1 ? "bg-red-100 text-red-700" :
                daysLeft <= 7 ? "bg-amber-100 text-amber-700" :
                "bg-blue-50 text-blue-700";

              return (
                <Link
                  key={event.id}
                  href={`/matters/${event.matter?.id}`}
                  onClick={() => setActivePanel(null)}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold ${urgencyColor}`}>
                    {daysLeft <= 0 ? "!" : `${daysLeft}d`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.matter?.reference} &middot; {format(eventDate, "d MMM yyyy")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
            {(data?.upcomingEvents || []).length === 0 && (
              <div className="py-6 text-center">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No upcoming deadlines.</p>
              </div>
            )}
          </div>
          <Button className="w-full" onClick={() => { setActivePanel(null); router.push("/calendar"); }}>
            <Calendar className="mr-2 h-4 w-4" /> Open Calendar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Overdue Dialog */}
      <Dialog open={activePanel === "overdue"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Items
              {(data?.overdueCount ?? 0) > 0 && (
                <Badge variant="destructive" className="text-[10px] ml-auto">{data?.overdueCount} overdue</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {(data?.overdueCount ?? 0) > 0 ? (
            <div className="space-y-2">
              {overdue.map((event: any) => {
                const eventDate = new Date(event.startDate);
                const daysOverdue = Math.abs(differenceInDays(eventDate, new Date()));
                return (
                  <Link
                    key={event.id}
                    href={`/matters/${event.matter?.id}`}
                    onClick={() => setActivePanel(null)}
                    className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-3 transition-all duration-200 hover:bg-red-100/50 hover:shadow-sm group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-100 text-xs font-bold text-red-700">
                      {daysOverdue}d
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.matter?.reference} &middot; {event.matter?.title}
                      </p>
                      <p className="text-xs text-red-600 font-medium mt-0.5">
                        {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue &middot; Due {format(eventDate, "d MMM")}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-red-400 shrink-0 group-hover:text-red-600 transition-colors" />
                  </Link>
                );
              })}
              {overdue.length === 0 && overdueEvents && (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading overdue items...</p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500/50" />
              <h3 className="mt-3 text-sm font-semibold text-green-700">All Clear!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                No overdue deadlines. Everything is on track.
              </p>
            </div>
          )}
          <Button className="w-full" variant={data?.overdueCount > 0 ? "destructive" : "default"} onClick={() => { setActivePanel(null); router.push("/calendar"); }}>
            <Calendar className="mr-2 h-4 w-4" /> Open Calendar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Completed Dialog */}
      <Dialog open={activePanel === "completed"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Completed This Week
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mb-4">
                <TrendingUp className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="text-4xl font-bold text-emerald-600">{data?.completedThisWeek ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Directions confirmed this week</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-lg font-bold">{data?.activeMatters ?? 0}</div>
                <p className="text-[10px] text-muted-foreground">Active matters</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-lg font-bold">{data?.upcomingDeadlines ?? 0}</div>
                <p className="text-[10px] text-muted-foreground">Upcoming deadlines</p>
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={() => { setActivePanel(null); router.push("/matters"); }}>
            <Briefcase className="mr-2 h-4 w-4" /> View Matters
          </Button>
        </DialogContent>
      </Dialog>

      {/* Key Dates Dialog */}
      <Dialog open={activePanel === "keyDates"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-teal-600" />
              Key Dates Overview
            </DialogTitle>
          </DialogHeader>
          {/* Status breakdown */}
          {kdSummary && (
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
                <div className="text-lg font-bold text-red-700">{kdSummary.breached}</div>
                <p className="text-[9px] text-red-600 font-medium">BREACH</p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-2 text-center">
                <div className="text-lg font-bold text-red-600">{kdSummary.overdue}</div>
                <p className="text-[9px] text-red-500 font-medium">OVERDUE</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-center">
                <div className="text-lg font-bold text-amber-700">{kdSummary.atRisk}</div>
                <p className="text-[9px] text-amber-600 font-medium">AT RISK</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-center">
                <div className="text-lg font-bold text-green-700">{kdSummary.onTrack}</div>
                <p className="text-[9px] text-green-600 font-medium">ON TRACK</p>
              </div>
            </div>
          )}
          {/* Key dates list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Most Urgent</p>
            {(data?.upcomingKeyDates || []).map((kd: any) => {
              const dueDate = new Date(kd.dueDate);
              const daysLeft = differenceInDays(dueDate, new Date());
              const isBreach = kd.status === "BREACH";
              const isOverdue = kd.status === "OVERDUE";

              return (
                <div
                  key={kd.id}
                  className={`flex items-center rounded-lg border ${
                    isBreach ? "border-red-300 bg-red-50/50" :
                    isOverdue ? "border-red-200 bg-red-50/30" : ""
                  }`}
                >
                  <Link
                    href={`/matters/${kd.matter?.id}`}
                    onClick={() => setActivePanel(null)}
                    className="flex flex-1 min-w-0 items-center gap-3 p-3 transition-colors hover:bg-muted/30 group"
                  >
                    <div className="relative shrink-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-bold ${KEY_DATE_STATUS_COLORS[kd.status]}`}>
                        {isBreach ? "48h+" :
                         isOverdue ? `${Math.abs(daysLeft)}d` :
                         daysLeft <= 0 ? "!" : `${daysLeft}d`}
                      </div>
                      {isBreach && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{kd.title}</p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${KEY_DATE_STATUS_COLORS[kd.status]}`}>
                          {kd.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {kd.matter?.reference} &middot; {kd.keyDateOwner?.firstName} {kd.keyDateOwner?.lastName}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  </Link>
                  <div className="flex items-center gap-0.5 pr-2 shrink-0">
                    {kd.keyDateOwner?.email && (
                      <a
                        href={getMailtoUrl(kd)}
                        title={`Email ${kd.keyDateOwner.firstName}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => downloadICS(kd)}
                      title="Download .ics"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-muted transition-colors"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {(data?.upcomingKeyDates || []).length === 0 && (
              <div className="py-6 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No key dates.</p>
              </div>
            )}
          </div>
          <Button className="w-full" onClick={() => { setActivePanel(null); router.push("/key-dates"); }}>
            <CalendarCheck className="mr-2 h-4 w-4" /> View All Key Dates
          </Button>
        </DialogContent>
      </Dialog>

      {/* Bottom section — Tabbed sub-grid with filters */}
      <Card>
        <Tabs defaultValue="matters" className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <TabsList className="h-9">
                <TabsTrigger value="matters" className="text-xs sm:text-sm gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Recent</span> Matters
                </TabsTrigger>
                <TabsTrigger value="deadlines" className="text-xs sm:text-sm gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Upcoming</span> Deadlines
                </TabsTrigger>
                <TabsTrigger value="keydates" className="text-xs sm:text-sm gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Key Dates
                  {kdUrgentTotal > 0 && (
                    <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-0.5">{kdUrgentTotal}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* ── Matters Tab ── */}
            <TabsContent value="matters" className="mt-0 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {["ALL", "ACTIVE", "ON_HOLD", "CLOSED"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setMatterFilter(f)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                        matterFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f === "ALL" ? "All" : f === "ON_HOLD" ? "On Hold" : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <Link href="/matters" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (() => {
                const filtered = (data?.recentMatters || []).filter(
                  (m: any) => matterFilter === "ALL" || m.status === matterFilter
                );
                return filtered.length > 0 ? (
                  <div className="divide-y rounded-lg border">
                    {filtered.map((matter: any) => (
                      <Link
                        key={matter.id}
                        href={`/matters/${matter.id}`}
                        className="flex items-center justify-between p-3 transition-all duration-150 hover:bg-muted/50 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{matter.reference}</span>
                            <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[matter.status] || ""}`}>
                              {matter.status}
                            </Badge>
                          </div>
                          <p className="truncate text-sm font-medium mt-0.5">{matter.title}</p>
                          {matter.owner && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {matter.owner.firstName} {matter.owner.lastName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-3 shrink-0">
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{matter._count?.directions ?? 0}</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {matterFilter === "ALL" ? "No matters yet." : `No ${matterFilter.toLowerCase().replace("_", " ")} matters.`}
                    </p>
                  </div>
                );
              })()}
            </TabsContent>

            {/* ── Deadlines Tab ── */}
            <TabsContent value="deadlines" className="mt-0 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {["ALL", "URGENT", "THIS_WEEK", "THIS_MONTH"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setDeadlineFilter(f)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                        deadlineFilter === f
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f === "ALL" ? "All" : f === "URGENT" ? "Urgent (<3d)" : f === "THIS_WEEK" ? "This Week" : "This Month"}
                    </button>
                  ))}
                </div>
                <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                  Calendar <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (() => {
                const events = (data?.upcomingEvents || []).filter((event: any) => {
                  if (deadlineFilter === "ALL") return true;
                  const dl = differenceInDays(new Date(event.startDate), new Date());
                  if (deadlineFilter === "URGENT") return dl <= 3;
                  if (deadlineFilter === "THIS_WEEK") return dl <= 7;
                  return dl <= 30;
                });
                return events.length > 0 ? (
                  <div className="divide-y rounded-lg border">
                    {events.map((event: any) => {
                      const eventDate = new Date(event.startDate);
                      const daysLeft = differenceInDays(eventDate, new Date());
                      const urgencyColor =
                        daysLeft <= 1 ? "bg-red-100 text-red-700" :
                        daysLeft <= 7 ? "bg-amber-100 text-amber-700" :
                        "bg-blue-50 text-blue-700";

                      return (
                        <Link
                          key={event.id}
                          href={`/matters/${event.matter?.id}`}
                          className="flex items-center gap-3 p-3 transition-all duration-150 hover:bg-muted/50 group"
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold ${urgencyColor}`}>
                            {daysLeft <= 0 ? "!" : `${daysLeft}d`}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{event.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {event.matter?.reference} &middot; {format(eventDate, "d MMM yyyy")}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Calendar className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground">No deadlines matching this filter.</p>
                  </div>
                );
              })()}
            </TabsContent>

            {/* ── Key Dates Tab ── */}
            <TabsContent value="keydates" className="mt-0 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {["ALL", "BREACH", "OVERDUE", "AT_RISK", "ON_TRACK"].map((f) => {
                    const chipColors: Record<string, string> = {
                      BREACH: keyDateFilter === "BREACH" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100",
                      OVERDUE: keyDateFilter === "OVERDUE" ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100",
                      AT_RISK: keyDateFilter === "AT_RISK" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100",
                      ON_TRACK: keyDateFilter === "ON_TRACK" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100",
                    };
                    return (
                      <button
                        key={f}
                        onClick={() => setKeyDateFilter(f)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                          f === "ALL"
                            ? keyDateFilter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            : chipColors[f]
                        }`}
                      >
                        {f === "ALL" ? "All" : f === "AT_RISK" ? "At Risk" : f === "ON_TRACK" ? "On Track" : f.charAt(0) + f.slice(1).toLowerCase()}
                        {f !== "ALL" && kdSummary && (
                          <span className="ml-1 opacity-70">
                            ({f === "BREACH" ? kdSummary.breached : f === "OVERDUE" ? kdSummary.overdue : f === "AT_RISK" ? kdSummary.atRisk : kdSummary.onTrack})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Link href="/key-dates" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (() => {
                const filtered = (data?.upcomingKeyDates || []).filter(
                  (kd: any) => keyDateFilter === "ALL" || kd.status === keyDateFilter
                );
                return filtered.length > 0 ? (
                  <div className="divide-y rounded-lg border">
                    {filtered.map((kd: any) => {
                      const dueDate = new Date(kd.dueDate);
                      const daysLeft = differenceInDays(dueDate, new Date());
                      const isBreach = kd.status === "BREACH";
                      const isOverdue = kd.status === "OVERDUE";

                      return (
                        <div
                          key={kd.id}
                          className={`flex items-center ${isBreach ? "bg-red-50/50" : isOverdue ? "bg-red-50/30" : ""}`}
                        >
                          {/* Main link area */}
                          <Link
                            href={`/matters/${kd.matter?.id}`}
                            className="flex flex-1 min-w-0 items-center gap-3 p-3 transition-colors hover:bg-muted/50 group"
                          >
                            <div className="relative shrink-0">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-bold ${KEY_DATE_STATUS_COLORS[kd.status]}`}>
                                {isBreach ? "48h+" : isOverdue ? `${Math.abs(daysLeft)}d` : daysLeft <= 0 ? "!" : `${daysLeft}d`}
                              </div>
                              {isBreach && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium">{kd.title}</p>
                                <Badge variant="outline" className={`text-[10px] shrink-0 ${KEY_DATE_STATUS_COLORS[kd.status]}`}>
                                  {kd.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {kd.matter?.reference} &middot; {kd.keyDateOwner?.firstName} {kd.keyDateOwner?.lastName} &middot; {format(dueDate, "d MMM")}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                          </Link>
                          {/* Action buttons */}
                          <div className="flex items-center gap-0.5 pr-2 shrink-0">
                            {kd.keyDateOwner?.email && (
                              <a
                                href={getMailtoUrl(kd)}
                                title={`Email ${kd.keyDateOwner.firstName}`}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => downloadICS(kd)}
                              title="Download .ics"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-muted transition-colors"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {keyDateFilter === "ALL" ? "No key dates yet." : `No ${keyDateFilter.toLowerCase().replace("_", " ")} key dates.`}
                    </p>
                  </div>
                );
              })()}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
