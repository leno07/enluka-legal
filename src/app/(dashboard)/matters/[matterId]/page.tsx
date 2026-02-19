"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  Pencil,
  Target,
  Upload,
  Users,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { MatterKeyDates } from "@/components/matters/matter-key-dates";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const DIR_STATUS_BORDER: Record<string, string> = {
  PENDING_REVIEW: "border-l-amber-400",
  CONFIRMED: "border-l-green-500",
  VACATED: "border-l-red-400",
  DRAFT: "border-l-gray-300",
  AMENDED: "border-l-blue-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  COURT_ORDER: "Court Order",
  WITNESS_STATEMENT: "Witness Statement",
  EXPERT_REPORT: "Expert Report",
  SKELETON_ARGUMENT: "Skeleton Argument",
  CORRESPONDENCE: "Correspondence",
  EVIDENCE: "Evidence",
  PLEADING: "Pleading",
  APPLICATION: "Application",
  OTHER: "Other",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RoleRow({ label, user: roleUser }: { label: string; user: any | null }) {
  if (!roleUser) return null;
  const initials = `${roleUser.firstName[0]}${roleUser.lastName[0]}`.toUpperCase();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm">{roleUser.firstName} {roleUser.lastName}</span>
      </div>
      <Badge variant="outline" className="text-[10px]">{label}</Badge>
    </div>
  );
}

export default function MatterWorkspacePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [roleEdits, setRoleEdits] = useState({ matterManagerId: "", matterPartnerId: "", clientPartnerId: "" });

  const { data: members } = useQuery({
    queryKey: ["firm-members"],
    queryFn: () => apiFetch(`/api/firms/${user?.firmId}/members`),
    enabled: !!user?.firmId,
  });

  const updateRolesMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/api/matters/${matterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
      setRolesDialogOpen(false);
      toast.success("Matter team roles updated");
    },
    onError: () => toast.error("Failed to update roles"),
  });

  const { data: matter, isLoading } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}`),
  });

  const { data: directions } = useQuery({
    queryKey: ["directions", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/directions`),
    enabled: !!matter,
  });

  const { data: documents } = useQuery({
    queryKey: ["documents", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/documents`),
    enabled: !!matter,
  });

  const { data: bundles } = useQuery({
    queryKey: ["bundles", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/bundles`),
    enabled: !!matter,
  });

  const { data: calendarEvents } = useQuery({
    queryKey: ["calendar", matterId],
    queryFn: () => apiFetch(`/api/calendar?matterId=${matterId}`),
    enabled: !!matter,
  });

  const { data: keyDates } = useQuery({
    queryKey: ["key-dates", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/key-dates`),
    enabled: !!matter,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Matter not found</h2>
      </div>
    );
  }

  // Key date urgency for tab badge
  const kdUrgent = (keyDates || []).filter((kd: any) => !kd.completedAt && (kd.status === "BREACH" || kd.status === "OVERDUE")).length;
  const kdAtRisk = (keyDates || []).filter((kd: any) => !kd.completedAt && kd.status === "AT_RISK").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-mono text-muted-foreground">{matter.reference}</p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{matter.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> {matter.clientName}
            </span>
            {matter.court && (
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> {matter.court}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {matter.owner.firstName} {matter.owner.lastName}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className={STATUS_COLORS[matter.status] || ""}>
          {matter.status}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="directions">
              Directions ({directions?.length ?? matter._count.directions})
            </TabsTrigger>
            <TabsTrigger value="key-dates" className="relative">
              Key Dates ({keyDates?.length ?? matter._count.keyDates ?? 0})
              {kdUrgent > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {kdUrgent}
                </span>
              )}
              {kdUrgent === 0 && kdAtRisk > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                  {kdAtRisk}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">
              Docs ({documents?.length ?? matter._count.documents})
            </TabsTrigger>
            <TabsTrigger value="bundles">
              Bundles ({bundles?.length ?? matter._count.bundles})
            </TabsTrigger>
            <TabsTrigger value="calendar">
              Calendar ({calendarEvents?.length ?? matter._count.calendarEvents})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* === Overview === */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{matter.reference}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span>{matter.clientName}</span></div>
                {matter.caseNumber && <div className="flex justify-between"><span className="text-muted-foreground">Case number</span><span>{matter.caseNumber}</span></div>}
                {matter.court && <div className="flex justify-between"><span className="text-muted-foreground">Court</span><span>{matter.court}</span></div>}
                {matter.judge && <div className="flex justify-between"><span className="text-muted-foreground">Judge</span><span>{matter.judge}</span></div>}
                {matter.description && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Description</span>
                    <p className="mt-1">{matter.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Matter Team</CardTitle>
                <Dialog open={rolesDialogOpen} onOpenChange={(open) => {
                  setRolesDialogOpen(open);
                  if (open) {
                    setRoleEdits({
                      matterManagerId: matter.matterManager?.id || "_none",
                      matterPartnerId: matter.matterPartner?.id || "_none",
                      clientPartnerId: matter.clientPartner?.id || "_none",
                    });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Matter Team Roles</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Matter Manager</Label>
                        <Select value={roleEdits.matterManagerId} onValueChange={(v) => setRoleEdits({ ...roleEdits, matterManagerId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            {members?.map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Matter Partner</Label>
                        <Select value={roleEdits.matterPartnerId} onValueChange={(v) => setRoleEdits({ ...roleEdits, matterPartnerId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            {members?.map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Client Partner</Label>
                        <Select value={roleEdits.clientPartnerId} onValueChange={(v) => setRoleEdits({ ...roleEdits, clientPartnerId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            {members?.map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        disabled={updateRolesMutation.isPending}
                        onClick={() => {
                          updateRolesMutation.mutate({
                            matterManagerId: roleEdits.matterManagerId === "_none" ? null : roleEdits.matterManagerId,
                            matterPartnerId: roleEdits.matterPartnerId === "_none" ? null : roleEdits.matterPartnerId,
                            clientPartnerId: roleEdits.clientPartnerId === "_none" ? null : roleEdits.clientPartnerId,
                          });
                        }}
                      >
                        {updateRolesMutation.isPending ? "Saving..." : "Save Roles"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <RoleRow label="Owner" user={matter.owner} />
                <RoleRow label="Matter Manager" user={matter.matterManager} />
                <RoleRow label="Matter Partner" user={matter.matterPartner} />
                <RoleRow label="Client Partner" user={matter.clientPartner} />
                {matter.assignments?.filter((a: any) => a.user.id !== matter.owner.id).map((a: any) => (
                  <RoleRow key={a.user.id} label={a.role} user={a.user} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === Key Dates === */}
        <TabsContent value="key-dates">
          <MatterKeyDates matterId={matterId} matter={matter} />
        </TabsContent>

        {/* === Directions (inline) === */}
        <TabsContent value="directions">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {directions?.length ?? 0} direction(s) extracted from court orders
              </p>
              <Link href={`/matters/${matterId}/directions`}>
                <Button size="sm">
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Parse Court Order
                </Button>
              </Link>
            </div>
            {directions?.length > 0 ? (
              directions.map((d: any) => {
                const dueDate = d.dueDate ? new Date(d.dueDate) : null;
                const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;
                return (
                  <div key={d.id} className={`rounded-lg border border-l-4 ${DIR_STATUS_BORDER[d.status] || "border-l-gray-300"} p-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground mr-1">{d.orderNumber}.</span>
                          {d.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{d.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {d.confidenceScore !== null && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            d.confidenceScore >= 0.85 ? "bg-green-50 text-green-700" :
                            d.confidenceScore >= 0.6 ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {Math.round(d.confidenceScore * 100)}%
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px]">{d.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                    {dueDate && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(dueDate, "d MMM yyyy")}
                        {daysLeft !== null && (
                          <span className={daysLeft <= 7 ? "text-amber-600 font-medium" : ""}>
                            ({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No directions yet. Upload a court order to extract directions with AI.
              </div>
            )}
            {directions?.length > 0 && (
              <Link href={`/matters/${matterId}/directions`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Manage directions <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </TabsContent>

        {/* === Documents (inline) === */}
        <TabsContent value="documents">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {documents?.length ?? 0} document(s) uploaded
              </p>
              <Link href={`/matters/${matterId}/documents`}>
                <Button size="sm">
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Document
                </Button>
              </Link>
            </div>
            {documents?.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </Badge>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span className="hidden sm:inline">{format(new Date(doc.createdAt), "d MMM")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* === Bundles (inline) === */}
        <TabsContent value="bundles">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {bundles?.length ?? 0} bundle(s) created
              </p>
              <Link href={`/matters/${matterId}/bundles/new`}>
                <Button size="sm">
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> New Bundle
                </Button>
              </Link>
            </div>
            {bundles?.length > 0 ? (
              <div className="grid gap-3">
                {bundles.map((b: any) => (
                  <Link key={b.id} href={`/matters/${matterId}/bundles`}>
                    <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">{b.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {b._count?.documents ?? 0} documents &middot; {b.totalPages ?? 0} pages
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${
                          b.status === "READY" ? "bg-green-50 text-green-700 border-green-200" :
                          b.status === "GENERATING" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          b.status === "FAILED" ? "bg-red-50 text-red-700 border-red-200" :
                          ""
                        }`}>
                          {b.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No bundles created yet. Assemble documents into court-compliant bundles.
              </div>
            )}
          </div>
        </TabsContent>

        {/* === Calendar (inline) === */}
        <TabsContent value="calendar">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deadlines and events for this matter
            </p>
            {calendarEvents?.length > 0 ? (
              <div className="space-y-2">
                {calendarEvents.map((evt: any) => {
                  const evtDate = new Date(evt.startDate);
                  const daysLeft = differenceInDays(evtDate, new Date());
                  const isOverdue = daysLeft < 0 && !evt.completedAt;
                  return (
                    <div key={evt.id} className={`flex items-center gap-3 rounded-lg border p-3 ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                        isOverdue ? "bg-red-100 text-red-700" :
                        daysLeft <= 7 ? "bg-amber-100 text-amber-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {isOverdue ? "!" : `${daysLeft}d`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{evt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(evtDate, "d MMMM yyyy")}
                          {isOverdue && <span className="text-red-600 ml-1 font-medium">Overdue</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No calendar events. Confirm directions to create deadline events.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
