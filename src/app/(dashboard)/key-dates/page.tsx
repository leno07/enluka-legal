"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarCheck, Search, Clock, AlertTriangle } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";

const STATUS_BADGE_COLORS: Record<string, string> = {
  BREACH: "bg-red-100 text-red-800 border-red-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  AT_RISK: "bg-amber-50 text-amber-700 border-amber-200",
  ON_TRACK: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_BORDER: Record<string, string> = {
  BREACH: "border-l-red-600",
  OVERDUE: "border-l-red-400",
  AT_RISK: "border-l-amber-400",
  ON_TRACK: "border-l-green-500",
};

const ESCALATION_TIERS = [
  { label: "5d", color: "bg-amber-400" },
  { label: "3d", color: "bg-orange-400" },
  { label: "1d", color: "bg-red-400" },
  { label: "48h", color: "bg-red-600" },
];

export default function KeyDatesPage() {
  const { apiFetch } = useApi();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["all-key-dates", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      return apiFetch(`/api/key-dates?${params}`);
    },
  });

  const keyDates = data?.data || [];

  // Summary counts
  const counts = { total: 0, onTrack: 0, atRisk: 0, overdue: 0, breach: 0 };
  keyDates.forEach((kd: any) => {
    counts.total++;
    if (kd.completedAt) return;
    if (kd.status === "BREACH") counts.breach++;
    else if (kd.status === "OVERDUE") counts.overdue++;
    else if (kd.status === "AT_RISK") counts.atRisk++;
    else counts.onTrack++;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Key Dates</h1>
        <p className="text-sm text-muted-foreground">
          Track critical legal deadlines across all matters
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{counts.breach}</div>
            <p className="text-xs text-muted-foreground">In Breach</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-300">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">{counts.overdue}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{counts.atRisk}</div>
            <p className="text-xs text-muted-foreground">At Risk</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{counts.onTrack}</div>
            <p className="text-xs text-muted-foreground">On Track</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search key dates or matters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="BREACH">Breach</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="AT_RISK">At Risk</SelectItem>
            <SelectItem value="ON_TRACK">On Track</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key dates list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : keyDates.length > 0 ? (
        <div className="space-y-3">
          {keyDates.map((kd: any) => {
            const dueDate = new Date(kd.dueDate);
            const daysLeft = differenceInDays(dueDate, new Date());
            const hoursOverdue = differenceInHours(new Date(), dueDate);
            const isBreach = kd.status === "BREACH";
            const isCompleted = !!kd.completedAt;

            let activeTierIndex = -1;
            if (!isCompleted) {
              if (hoursOverdue >= 48) activeTierIndex = 3;
              else if (daysLeft <= 1) activeTierIndex = 2;
              else if (daysLeft <= 3) activeTierIndex = 1;
              else if (daysLeft <= 5) activeTierIndex = 0;
            }

            return (
              <Link
                key={kd.id}
                href={`/matters/${kd.matter?.id}`}
                className={`block rounded-lg border border-l-4 ${isCompleted ? "border-l-gray-300 opacity-60" : STATUS_BORDER[kd.status]} p-3 sm:p-4 transition-all duration-200 hover:shadow-sm hover:bg-muted/30 ${
                  isBreach ? "bg-red-50/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-semibold ${isCompleted ? "line-through" : ""}`}>{kd.title}</h3>
                      {kd.priority === "HIGH" && <Badge variant="destructive" className="text-[10px]">HIGH</Badge>}
                      <Badge variant="outline" className={`text-[10px] ${isCompleted ? "" : STATUS_BADGE_COLORS[kd.status]}`}>
                        {isCompleted ? "COMPLETED" : kd.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      <span className="font-mono">{kd.matter?.reference}</span> &middot; {kd.matter?.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {format(dueDate, "d MMM yyyy")}
                      </span>
                      {!isCompleted && (
                        <span className={
                          isBreach ? "text-red-700 font-bold" :
                          kd.status === "OVERDUE" ? "text-red-600 font-medium" :
                          kd.status === "AT_RISK" ? "text-amber-600 font-medium" :
                          "text-green-600"
                        }>
                          {isBreach ? `BREACH - ${Math.floor(hoursOverdue)}h` :
                           daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` :
                           daysLeft === 0 ? "Due today" :
                           `${daysLeft}d remaining`}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                          <AvatarFallback className="text-[7px] sm:text-[8px] bg-primary/10 text-primary">
                            {kd.keyDateOwner?.firstName?.[0]}{kd.keyDateOwner?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                          {kd.keyDateOwner?.firstName} {kd.keyDateOwner?.lastName}
                        </span>
                      </div>
                    </div>

                    {/* Escalation dots */}
                    {!isCompleted && (
                      <div className="mt-2 flex items-center gap-1">
                        {ESCALATION_TIERS.map((tier, idx) => (
                          <div key={idx} className="flex items-center gap-0.5">
                            {idx > 0 && <div className="h-px w-2 bg-gray-200" />}
                            <div className={`h-2 w-2 rounded-full ${
                              idx <= activeTierIndex ? tier.color : "bg-gray-200"
                            }`} />
                            <span className={`text-[8px] ${idx <= activeTierIndex ? "font-semibold" : "text-muted-foreground"}`}>
                              {tier.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isBreach && (
                    <div className="relative shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-3 text-lg font-semibold">No key dates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statusFilter !== "ALL"
              ? "Try adjusting your filters."
              : "Add key dates to matters to track critical legal deadlines."}
          </p>
        </div>
      )}
    </div>
  );
}
