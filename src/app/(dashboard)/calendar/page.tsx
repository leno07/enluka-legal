"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { format, isPast, isToday, addDays, isSameDay, differenceInDays, startOfDay } from "date-fns";
import Link from "next/link";

export default function CalendarPage() {
  const { apiFetch } = useApi();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Fetch upcoming events (next 90 days)
  const { data: events, isLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => {
      const end = addDays(new Date(), 90).toISOString();
      return apiFetch(`/api/calendar?endDate=${end}`);
    },
  });

  // Split overdue vs upcoming
  const allEvents = events || [];
  const overdue = allEvents.filter(
    (e: any) => !e.completedAt && isPast(new Date(e.startDate)) && !isToday(new Date(e.startDate))
  );
  const upcoming = allEvents.filter(
    (e: any) => !isPast(new Date(e.startDate)) || isToday(new Date(e.startDate))
  );

  // Dates that have events (for calendar highlighting)
  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    allEvents.forEach((e: any) => {
      dates.push(startOfDay(new Date(e.startDate)));
    });
    return dates;
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

  // Filter events by selected date
  const filteredEvents = selectedDate
    ? allEvents.filter((e: any) => isSameDay(new Date(e.startDate), selectedDate))
    : upcoming;

  // Group events by week
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Deadlines and events from confirmed court directions
        </p>
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

      {/* Main content: calendar + event list */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mini calendar */}
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

        {/* Event list */}
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
                // Show flat list for selected date
                <div className="space-y-2">
                  {filteredEvents.map((event: any) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                // Show grouped for all upcoming
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
