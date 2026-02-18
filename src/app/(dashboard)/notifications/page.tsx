"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const typeIcons: Record<string, React.ReactNode> = {
  DEADLINE_REMINDER: <Clock className="h-4 w-4 text-yellow-500" />,
  ESCALATION: <AlertTriangle className="h-4 w-4 text-red-500" />,
  ASSIGNMENT: <Bell className="h-4 w-4 text-blue-500" />,
  DIRECTION_PARSED: <Check className="h-4 w-4 text-green-500" />,
  BUNDLE_READY: <Check className="h-4 w-4 text-green-500" />,
  SYSTEM: <Bell className="h-4 w-4 text-gray-500" />,
};

export default function NotificationsPage() {
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();
  const [acknowledgeId, setAcknowledgeId] = useState<string | null>(null);
  const [ackStatus, setAckStatus] = useState("REVIEWED");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications?limit=50"),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({
      notificationId,
      status,
    }: {
      notificationId: string;
      status: string;
    }) =>
      apiFetch(`/api/notifications/${notificationId}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setAcknowledgeId(null);
      toast.success("Notification acknowledged");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {data?.unreadCount || 0} unread notification(s)
          </p>
        </div>
      </div>

      {data?.data?.length > 0 ? (
        <div className="space-y-3">
          {data.data.map((notification: any) => (
            <Card
              key={notification.id}
              className={notification.readAt ? "opacity-75" : ""}
            >
              <CardContent className="flex items-start gap-3 py-4">
                <div className="mt-1 shrink-0">
                  {typeIcons[notification.type] || (
                    <Bell className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.calendarEvent && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Matter: {notification.calendarEvent.matter?.reference}
                          {" - "}
                          {notification.calendarEvent.matter?.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:text-right shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(notification.createdAt),
                          "d MMM HH:mm"
                        )}
                      </span>
                      {!notification.readAt && (
                        <Badge className="bg-blue-100 text-blue-800">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>

                  {notification.acknowledgement ? (
                    <div className="mt-2">
                      <Badge variant="outline">
                        {notification.acknowledgement.status}
                      </Badge>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {acknowledgeId === notification.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={ackStatus}
                            onValueChange={setAckStatus}
                          >
                            <SelectTrigger className="w-32 sm:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REVIEWED">Reviewed</SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                In Progress
                              </SelectItem>
                              <SelectItem value="FILED">Filed</SelectItem>
                              <SelectItem value="DISMISSED">
                                Dismissed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() =>
                              acknowledgeMutation.mutate({
                                notificationId: notification.id,
                                status: ackStatus,
                              })
                            }
                            disabled={acknowledgeMutation.isPending}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAcknowledgeId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAcknowledgeId(notification.id)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re all caught up. Notifications will appear here when
              deadlines approach or actions are needed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
