"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const tierLabels: Record<string, string> = {
  T_14D: "14 days before",
  T_7D: "7 days before",
  T_48H: "48 hours before",
  T_24H: "24 hours before",
  OVERDUE: "Past due",
};

const escalateToLabels: Record<string, string> = {
  ASSIGNED: "Assigned Staff",
  SUPERVISOR: "Supervisor",
  OWNER: "Matter Owner",
  PARTNER_COLP: "Partner / COLP",
};

export default function EscalationPoliciesPage() {
  const { apiFetch } = useApi();

  const { data: policies, isLoading } = useQuery({
    queryKey: ["escalation-policies"],
    queryFn: () => apiFetch("/api/admin/escalation-policies"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Escalation Policies
        </h1>
        <p className="text-muted-foreground">
          Configure deadline reminder and escalation rules for your firm
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Policies</CardTitle>
          <CardDescription>
            Define when and to whom deadline reminders are escalated
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Escalate To</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies?.map((policy: any) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      {tierLabels[policy.tier] || policy.tier}
                    </TableCell>
                    <TableCell>{policy.offsetHours} hours</TableCell>
                    <TableCell>
                      {escalateToLabels[policy.escalateTo] ||
                        policy.escalateTo}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {policy.channels.map((ch: string) => (
                          <Badge key={ch} variant="secondary" className="text-xs">
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={policy.isActive ? "default" : "secondary"}
                      >
                        {policy.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
