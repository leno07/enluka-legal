"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  format,
  isPast,
  isToday,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  differenceInDays,
  startOfDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
} from "date-fns";
import Link from "next/link";

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const { apiFetch } = useApi();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Fetch upcoming events (next 90 days) + key dates
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => {
      const end = addDays(new Date(), 90).toISOString();
      return apiFetch(`/api/calendar?endDate=${end}`);
    },
  });

  const { data: keyDatesData, isLoading: keyDatesLoading } = useQuery({
    queryKey: ["all-key-dates-calendar"],
    queryFn: () => apiFetch(`/api/key-dates?limit=100`),
  });

  const isLoading = eventsLoading || keyDatesLoading;
  const allEvents = events || [];
  const allKeyDates = keyDatesData?.data || [];

  // Split overdue vs upcoming
  const overdue = allEvents.filter(
    (e: any) => !e.completedAt && isPast(new Date(e.startDate)) && !isToday(new Date(e.startDate))
  );
  const upcoming = allEvents.filter(
    (e: any) => !isPast(new Date(e.startDate)) || isToday(new Date(e.startDate))
  );

  // Dates that have events (for calendar highlighting)
  const eventDates = useMemo(() => {
    return allEvents.map((e: any) => startOfDay(new Date(e.startDate)));
  }, [allEvents]);

  const overdueDates = useMemo(() => {
    return overdue.map((e: any) => startOfDay(new Date(e.startDate)));
  }, [overdue]);

  const urgentDates = useMemo(() => {
    const now = new Date();
    return upcoming
      .filter((e: any) => differenceInDays(new Date(e.startDate), now) <= 7)
      .map((e: any) => startOfDay(new Date(e.startDate)));
  }, [upcoming]);

  // Filter events by selected date (month view)
  const filteredEvents = selectedDate
    ? allEvents.filter((e: any) => isSameDay(new Date(e.startDate), selectedDate))
    : upcoming;

  // Group events by week (month view)
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const groups: Record<string, any[]> = {
      "This Week": [],
      "Next Week": [],
      "Later": [],
    };
    filteredEvents.forEach((e: any) => {
      const days = differenceInDays(new Date(e.startDate), now);
      if (days <= 7) groups["This Week"].push(e);
      else if (days <= 14) groups["Next Week"].push(e);
      else groups["Later"].push(e);
    });
    return groups;
  }, [filteredEvents]);

  // Week view data
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekEvents = useMemo(() => {
    const result: Record<string, any[]> = {};
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      result[key] = [];
    });

    allEvents.forEach((e: any) => {
      const eventDay = format(new Date(e.startDate), "yyyy-MM-dd");
      if (result[eventDay]) {
        result[eventDay].push({ ...e, _type: "event" });
      }
    });

    allKeyDates.forEach((kd: any) => {
      const kdDay = format(new Date(kd.dueDate), "yyyy-MM-dd");
      if (result[kdDay]) {
        result[kdDay].push({ ...kd, _type: "keyDate" });
      }
    });

    return result;
  }, [allEvents, allKeyDates, weekDays]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Deadlines, events, and key dates from court directions
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("month")}
          >
            <LayoutGrid className="mr-1 h-3 w-3" /> Month
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("week")}
          >
            <List className="mr-1 h-3 w-3" /> Week
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-800">
              <AlertTriangle className="h-4 w-4" />
              {overdue.length} Overdue Deadline{overdue.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdue.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/matters/${event.matter.id}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-red-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-red-900">{event.title}</p>
                    <p className="text-xs text-red-700">
                      {event.matter?.reference} &middot; {event.matter?.title}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    {format(new Date(event.startDate), "d MMM")}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === MONTH VIEW === */}
      {viewMode === "month" && (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="h-4 w-4" />
                Month View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasEvent: eventDates,
                  overdue: overdueDates,
                  urgent: urgentDates,
                }}
                modifiersClassNames={{
                  hasEvent: "font-bold underline decoration-primary decoration-2 underline-offset-4",
                  overdue: "font-bold underline decoration-red-500 decoration-2 underline-offset-4",
                  urgent: "font-bold underline decoration-amber-500 decoration-2 underline-offset-4",
                }}
                className="rounded-md"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(undefined)}
                  className="mt-2 w-full text-center text-xs text-primary hover:underline"
                >
                  Clear filter &mdash; show all upcoming
                </button>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedDate
                  ? `Events on ${format(selectedDate, "d MMMM yyyy")}`
                  : "Upcoming Deadlines"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.length > 0 ? (
                selectedDate ? (
                  <div className="space-y-2">
                    {filteredEvents.map((event: any) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(groupedEvents).map(([group, evts]) =>
                      evts.length > 0 ? (
                        <div key={group}>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{group}</p>
                          <div className="space-y-2">
                            {evts.map((event: any) => (
                              <EventRow key={event.id} event={event} />
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {selectedDate
                    ? "No events on this date."
                    : "No upcoming deadlines. Confirm court directions to create calendar events."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* === WEEK VIEW === */}
      {viewMode === "week" && (
        <div className="space-y-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="text-center min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">
                {format(weekStart, "d MMM")} &mdash; {format(weekEnd, "d MMM yyyy")}
              </p>
              <button
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="text-[10px] text-primary hover:underline"
              >
                Go to this week
              </button>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>

          {/* 7-column grid — horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="grid grid-cols-7 gap-2 min-w-[640px] md:min-w-0">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = weekEvents[key] || [];
              const isCurrentDay = isToday(day);
              const isPastDay = isPast(day) && !isCurrentDay;

              return (
                <div
                  key={key}
                  className={`min-h-[140px] md:min-h-[160px] rounded-lg border p-1.5 md:p-2 transition-colors ${
                    isCurrentDay
                      ? "border-primary bg-primary/5"
                      : isPastDay
                      ? "bg-muted/30"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <div className="mb-1.5 md:mb-2 flex items-center justify-between">
                    <span className={`text-[10px] md:text-xs font-medium ${isCurrentDay ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day, "EEE")}
                    </span>
                    <span className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full text-[10px] md:text-xs font-bold ${
                      isCurrentDay ? "bg-primary text-primary-foreground" : ""
                    }`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.length === 0 && (
                      <p className="text-[9px] text-muted-foreground/50 text-center pt-4">No events</p>
                    )}
                    {items.map((item: any) => {
                      if (item._type === "keyDate") {
                        const kd = item;
                        const statusColor =
                          kd.status === "BREACH" ? "bg-red-500" :
                          kd.status === "OVERDUE" ? "bg-red-400" :
                          kd.status === "AT_RISK" ? "bg-amber-400" :
                          "bg-green-500";
                        return (
                          <Link
                            key={`kd-${kd.id}`}
                            href={`/matters/${kd.matter?.id}`}
                            className="block rounded px-1.5 py-1 bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <CalendarCheck className="h-2.5 w-2.5 text-primary shrink-0" />
                              <span className="text-[9px] font-semibold truncate">{kd.title}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                              <span className="text-[8px] text-muted-foreground truncate">{kd.matter?.reference}</span>
                            </div>
                          </Link>
                        );
                      }

                      const evt = item;
                      const evtDate = new Date(evt.startDate);
                      const isEvtOverdue = isPast(evtDate) && !isToday(evtDate) && !evt.completedAt;
                      return (
                        <Link
                          key={`evt-${evt.id}`}
                          href={`/matters/${evt.matter?.id || evt.matterId}`}
                          className={`block rounded px-1.5 py-1 transition-colors ${
                            isEvtOverdue
                              ? "bg-red-50 border border-red-200 hover:bg-red-100"
                              : evt.completedAt
                              ? "bg-muted/50 border opacity-60"
                              : "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                            <span className="text-[9px] font-medium truncate">{evt.title}</span>
                          </div>
                          <span className="text-[8px] text-muted-foreground truncate block">
                            {evt.matter?.reference}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground justify-center flex-wrap">
            <span className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded border border-blue-200 bg-blue-50" /> Calendar Event
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded border border-primary/20 bg-primary/5" /> Key Date
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded border border-red-200 bg-red-50" /> Overdue
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const eventDate = new Date(event.startDate);
  const daysUntil = differenceInDays(eventDate, new Date());
  const isOverdue = isPast(eventDate) && !isToday(eventDate) && !event.completedAt;

  return (
    <Link
      href={`/matters/${event.matter?.id || event.matterId}`}
      className={`flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors ${
        isOverdue ? "border-red-200 bg-red-50/50" : ""
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
        isOverdue ? "bg-red-100 text-red-700" :
        daysUntil <= 1 ? "bg-red-100 text-red-700" :
        daysUntil <= 7 ? "bg-amber-100 text-amber-700" :
        "bg-blue-50 text-blue-700"
      }`}>
        {isOverdue ? "!" : isToday(eventDate) ? "0d" : `${daysUntil}d`}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {event.matter?.reference} &middot; {event.matter?.title}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium">{format(eventDate, "d MMM yyyy")}</p>
        <p className={`text-[10px] ${
          isOverdue ? "text-red-600 font-medium" :
          daysUntil <= 7 ? "text-amber-600" :
          "text-muted-foreground"
        }`}>
          {isOverdue ? "Overdue" : isToday(eventDate) ? "Today" : `${daysUntil} days`}
        </p>
      </div>
    </Link>
  );
}
