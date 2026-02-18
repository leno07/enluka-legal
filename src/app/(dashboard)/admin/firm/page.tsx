"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
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
import { ROLE_LABELS } from "@/lib/roles";
import { Role } from "@prisma/client";

export default function FirmSettingsPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const { data: members, isLoading } = useQuery({
    queryKey: ["firm-members"],
    queryFn: () => apiFetch(`/api/firms/${user?.firmId}/members`),
    enabled: !!user?.firmId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firm Settings</h1>
        <p className="text-muted-foreground">
          Manage your firm and team members
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Users registered to your firm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[member.role as Role] || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.supervisor
                        ? `${member.supervisor.firstName} ${member.supervisor.lastName}`
                        : "-"}
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
