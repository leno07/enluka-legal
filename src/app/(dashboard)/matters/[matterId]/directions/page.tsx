"use client";

import { use, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  Upload,
  X,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  if (score >= 0.85) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200">
          <CheckCircle className="h-3 w-3" />
          High Confidence
        </div>
        <span className="text-xs font-mono text-green-600">{pct}%</span>
      </div>
    );
  }
  if (score >= 0.6) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
          <AlertTriangle className="h-3 w-3" />
          Review Recommended
        </div>
        <span className="text-xs font-mono text-amber-600">{pct}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
        <AlertTriangle className="h-3 w-3" />
        Manual Review Required
      </div>
      <span className="text-xs font-mono text-red-600">{pct}%</span>
    </div>
  );
}

const STATUS_BORDER: Record<string, string> = {
  DRAFT: "border-l-gray-300",
  PENDING_REVIEW: "border-l-amber-400",
  CONFIRMED: "border-l-green-500",
  AMENDED: "border-l-blue-500",
  VACATED: "border-l-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  CONFIRMED: "Confirmed",
  AMENDED: "Amended",
  VACATED: "Vacated",
};

export default function DirectionsPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const { data: directions, isLoading } = useQuery({
    queryKey: ["directions", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/directions`),
  });

  const confirmMutation = useMutation({
    mutationFn: (directionId: string) =>
      apiFetch(
        `/api/matters/${matterId}/directions/${directionId}/confirm`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directions", matterId] });
      toast.success("Direction confirmed and calendar event created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ directionId, data }: { directionId: string; data: any }) =>
      apiFetch(`/api/matters/${matterId}/directions/${directionId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directions", matterId] });
      setEditingId(null);
      toast.success("Direction updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleParsePdf = async (file: File) => {
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("lexsuite_access_token="))
        ?.split("=")[1];

      const response = await fetch(`/api/matters/${matterId}/parse-order`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Parse failed");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["directions", matterId] });
      toast.success(
        `Extracted ${result.directionsCount} directions from court order`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to parse court order");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      handleParsePdf(file);
    } else {
      toast.error("Please drop a PDF file");
    }
  }, [matterId]);

  const startEdit = (direction: any) => {
    setEditingId(direction.id);
    setEditValues({
      title: direction.title,
      description: direction.description,
      dueDate: direction.dueDate
        ? format(new Date(direction.dueDate), "yyyy-MM-dd")
        : "",
    });
  };

  const saveEdit = (directionId: string) => {
    updateMutation.mutate({
      directionId,
      data: {
        title: editValues.title,
        description: editValues.description,
        dueDate: editValues.dueDate || null,
      },
    });
  };

  const confirmAll = () => {
    const pending = directions?.filter(
      (d: any) => d.status === "PENDING_REVIEW" && d.confidenceScore >= 0.85
    );
    if (!pending?.length) {
      toast.info("No high-confidence directions to auto-confirm");
      return;
    }
    pending.forEach((d: any) => confirmMutation.mutate(d.id));
  };

  // Summary stats
  const total = directions?.length ?? 0;
  const confirmed = directions?.filter((d: any) => d.status === "CONFIRMED").length ?? 0;
  const pending = directions?.filter((d: any) => d.status === "PENDING_REVIEW").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Court Directions</h1>
        <p className="text-sm text-muted-foreground">
          Upload a court order to extract directions automatically with AI
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleParsePdf(file);
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-base font-semibold">Analysing court order with AI...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Extracting directions, dates, and responsible parties
            </p>
            <div className="mt-4 flex gap-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center py-10 cursor-pointer"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">
              Drop your court order here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse &middot; PDF files only
            </p>
          </button>
        )}
      </div>

      {/* Summary bar */}
      {total > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{total} direction{total !== 1 ? "s" : ""} extracted</span>
            <span className="text-muted-foreground">&middot;</span>
            <span className="text-green-600">{confirmed} confirmed</span>
            <span className="text-muted-foreground">&middot;</span>
            <span className="text-amber-600">{pending} pending review</span>
          </div>
          {directions?.some(
            (d: any) => d.status === "PENDING_REVIEW" && d.confidenceScore >= 0.85
          ) && (
            <Button size="sm" variant="outline" onClick={confirmAll}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Confirm All High-Confidence
            </Button>
          )}
        </div>
      )}

      {/* Direction cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
              <CardContent><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : directions?.length > 0 ? (
        <div className="space-y-3">
          {directions.map((direction: any) => {
            const dueDate = direction.dueDate ? new Date(direction.dueDate) : null;
            const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;

            return (
              <Card
                key={direction.id}
                className={`border-l-4 ${STATUS_BORDER[direction.status] || "border-l-gray-300"} transition-all duration-200`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {editingId === direction.id ? (
                        <Input
                          value={editValues.title}
                          onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                          className="text-base font-semibold"
                        />
                      ) : (
                        <CardTitle className="text-base leading-snug">
                          <span className="text-muted-foreground mr-1.5">{direction.orderNumber}.</span>
                          {direction.title}
                        </CardTitle>
                      )}
                      {direction.sourceDocument && (
                        <CardDescription className="mt-1 flex items-center gap-1.5">
                          <FileText className="h-3 w-3" />
                          {direction.sourceDocument.fileName}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <ConfidenceBadge score={direction.confidenceScore} />
                      <Badge variant="outline" className="text-[10px]">
                        {STATUS_LABELS[direction.status] || direction.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === direction.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editValues.description}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="min-h-[80px]"
                      />
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-sm font-medium">Due date</label>
                          <Input
                            type="date"
                            value={editValues.dueDate}
                            onChange={(e) => setEditValues({ ...editValues, dueDate: e.target.value })}
                            className="w-48"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(direction.id)} disabled={updateMutation.isPending}>
                          Save Changes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {direction.description}
                      </p>
                      {dueDate && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                            daysLeft !== null && daysLeft <= 1 ? "bg-red-50 text-red-700" :
                            daysLeft !== null && daysLeft <= 7 ? "bg-amber-50 text-amber-700" :
                            "bg-blue-50 text-blue-700"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {format(dueDate, "d MMMM yyyy")}
                          </div>
                          {daysLeft !== null && (
                            <span className={`text-xs font-medium ${
                              daysLeft <= 1 ? "text-red-600" :
                              daysLeft <= 7 ? "text-amber-600" :
                              "text-muted-foreground"
                            }`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` :
                               daysLeft === 0 ? "Due today" :
                               daysLeft === 1 ? "Due tomorrow" :
                               `${daysLeft} days remaining`}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        {direction.status === "PENDING_REVIEW" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => confirmMutation.mutate(direction.id)}
                              disabled={confirmMutation.isPending}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => startEdit(direction)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() =>
                                updateMutation.mutate({
                                  directionId: direction.id,
                                  data: { status: "VACATED" },
                                })
                              }
                            >
                              <X className="mr-1 h-3 w-3" />
                              Vacate
                            </Button>
                          </>
                        )}
                        {direction.status === "CONFIRMED" && (
                          <Button size="sm" variant="outline" onClick={() => startEdit(direction)}>
                            Amend
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No directions yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Upload a court order PDF above and AI will automatically extract directions,
              deadlines, and responsible parties with confidence scoring.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
