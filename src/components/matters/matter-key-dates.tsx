"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarCheck, Plus, Clock, CheckCircle } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  BREACH: "border-l-red-600",
  OVERDUE: "border-l-red-400",
  AT_RISK: "border-l-amber-400",
  ON_TRACK: "border-l-green-500",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  BREACH: "bg-red-100 text-red-800 border-red-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  AT_RISK: "bg-amber-50 text-amber-700 border-amber-200",
  ON_TRACK: "bg-green-50 text-green-700 border-green-200",
};

const ESCALATION_TIERS = [
  { days: 5, label: "5 days", role: "Key Date Owner", color: "bg-amber-400" },
  { days: 3, label: "3 days", role: "Matter Manager", color: "bg-orange-400" },
  { days: 1, label: "1 day", role: "Matter Partner", color: "bg-red-400" },
  { days: -2, label: "48h+", role: "Client Partner", color: "bg-red-600" },
];

interface MatterKeyDatesProps {
  matterId: string;
  matter: any;
}

export function MatterKeyDates({ matterId, matter }: MatterKeyDatesProps) {
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    keyDateOwnerId: "",
    priority: "NORMAL",
  });

  const { data: keyDates, isLoading } = useQuery({
    queryKey: ["key-dates", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/key-dates`),
  });

  const { data: members } = useQuery({
    queryKey: ["firm-members"],
    queryFn: () => apiFetch(`/api/firms/${user?.firmId}/members`),
    enabled: !!user?.firmId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/api/matters/${matterId}/key-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-dates", matterId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDialogOpen(false);
      setFormData({ title: "", description: "", dueDate: "", keyDateOwnerId: "", priority: "NORMAL" });
      toast.success("Key date created");
    },
    onError: () => toast.error("Failed to create key date"),
  });

  const completeMutation = useMutation({
    mutationFn: (keyDateId: string) =>
      apiFetch(`/api/matters/${matterId}/key-dates/${keyDateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: new Date().toISOString(), status: "ON_TRACK" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-dates", matterId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Key date marked as complete");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Summary counts
  const counts = { total: 0, onTrack: 0, atRisk: 0, overdue: 0, breach: 0 };
  (keyDates || []).forEach((kd: any) => {
    counts.total++;
    if (kd.completedAt) return;
    const s = kd.status as string;
    if (s === "BREACH") counts.breach++;
    else if (s === "OVERDUE") counts.overdue++;
    else if (s === "AT_RISK") counts.atRisk++;
    else counts.onTrack++;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">{counts.total} key date(s)</span>
          {counts.breach > 0 && <Badge variant="destructive" className="text-[10px]">{counts.breach} Breach</Badge>}
          {counts.overdue > 0 && <Badge className="text-[10px] bg-red-100 text-red-700">{counts.overdue} Overdue</Badge>}
          {counts.atRisk > 0 && <Badge className="text-[10px] bg-amber-100 text-amber-700">{counts.atRisk} At Risk</Badge>}
          {counts.onTrack > 0 && <Badge className="text-[10px] bg-green-100 text-green-700">{counts.onTrack} On Track</Badge>}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Key Date
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Key Date</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., File Defence and Counterclaim"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Key Date Owner *</Label>
                <Select value={formData.keyDateOwnerId} onValueChange={(v) => setFormData({ ...formData, keyDateOwnerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    {members?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Key Date"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key date cards */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />)}</div>
      ) : (keyDates?.length ?? 0) > 0 ? (
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
              <Card
                key={kd.id}
                className={`border-l-4 ${isCompleted ? "border-l-gray-300 opacity-60" : STATUS_COLORS[kd.status] || "border-l-gray-300"} transition-all duration-200 hover:shadow-sm`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-semibold ${isCompleted ? "line-through" : ""}`}>{kd.title}</h4>
                        {kd.priority === "HIGH" && <Badge variant="destructive" className="text-[10px]">HIGH</Badge>}
                        <Badge variant="outline" className={`text-[10px] ${isCompleted ? "" : STATUS_BADGE_COLORS[kd.status]}`}>
                          {isCompleted ? "COMPLETED" : kd.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {kd.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{kd.description}</p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(dueDate, "d MMM yyyy")}
                        </span>
                        {!isCompleted && (
                          <span className={
                            isBreach ? "text-red-700 font-bold" :
                            kd.status === "OVERDUE" ? "text-red-600 font-medium" :
                            kd.status === "AT_RISK" ? "text-amber-600 font-medium" :
                            "text-green-600"
                          }>
                            {isBreach ? `BREACH - ${Math.floor(hoursOverdue)}h overdue` :
                             daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` :
                             daysLeft === 0 ? "Due today" :
                             `${daysLeft}d remaining`}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {kd.keyDateOwner?.firstName?.[0]}{kd.keyDateOwner?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {kd.keyDateOwner?.firstName} {kd.keyDateOwner?.lastName}
                        </span>
                      </div>

                      {!isCompleted && (
                        <div className="mt-3 flex items-center gap-1">
                          {ESCALATION_TIERS.map((tier, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              {idx > 0 && <div className="h-px w-3 bg-gray-200" />}
                              <div className="flex items-center gap-1">
                                <div className={`h-2.5 w-2.5 rounded-full ${
                                  idx <= activeTierIndex ? tier.color : "bg-gray-200"
                                } ${idx === activeTierIndex ? "ring-2 ring-offset-1 ring-red-300" : ""}`} />
                                <span className={`text-[9px] ${idx <= activeTierIndex ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                  {tier.label}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-8 text-xs"
                        onClick={() => completeMutation.mutate(kd.id)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Complete
                      </Button>
                    )}
                  </div>

                  {!isCompleted && activeTierIndex >= 0 && (
                    <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                      <span className="font-medium">Escalation: </span>
                      {activeTierIndex >= 0 && <span>Key Date Owner</span>}
                      {activeTierIndex >= 1 && <span> → Matter Manager{matter?.matterManager ? ` (${matter.matterManager.firstName})` : ""}</span>}
                      {activeTierIndex >= 2 && <span> → Matter Partner{matter?.matterPartner ? ` (${matter.matterPartner.firstName})` : ""}</span>}
                      {activeTierIndex >= 3 && <span> → Client Partner{matter?.clientPartner ? ` (${matter.clientPartner.firstName})` : ""}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-3 text-sm font-semibold">No key dates</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add key dates to track critical legal deadlines with escalation reminders.
          </p>
        </div>
      )}
    </div>
  );
}
