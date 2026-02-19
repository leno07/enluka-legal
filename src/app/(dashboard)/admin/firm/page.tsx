"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/roles";
import { Role } from "@prisma/client";
import { Mail, Users } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  COLP: "bg-indigo-100 text-indigo-700 border-indigo-200",
  PARTNER: "bg-blue-100 text-blue-700 border-blue-200",
  SUPERVISOR: "bg-sky-100 text-sky-700 border-sky-200",
  SENIOR_SOLICITOR: "bg-teal-100 text-teal-700 border-teal-200",
  SOLICITOR: "bg-green-100 text-green-700 border-green-200",
  TRAINEE: "bg-amber-100 text-amber-700 border-amber-200",
  PARALEGAL: "bg-gray-100 text-gray-700 border-gray-200",
};

const AVATAR_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500",
  COLP: "bg-indigo-500",
  PARTNER: "bg-blue-500",
  SUPERVISOR: "bg-sky-500",
  SENIOR_SOLICITOR: "bg-teal-500",
  SOLICITOR: "bg-green-500",
  TRAINEE: "bg-amber-500",
  PARALEGAL: "bg-gray-500",
};

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
        <h1 className="text-2xl font-bold tracking-tight">Firm Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your firm and team members
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{members?.length ?? 0} team members</span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members?.map((member: any) => {
            const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
            return (
              <Card
                key={member.id}
                className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className={`text-sm font-bold text-white ${AVATAR_COLORS[member.role] || "bg-gray-500"}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">
                          {member.firstName} {member.lastName}
                        </h3>
                        {member.isActive ? (
                          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Active" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-gray-300 shrink-0" title="Inactive" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${ROLE_COLORS[member.role] || ""}`}
                    >
                      {ROLE_LABELS[member.role as Role] || member.role}
                    </Badge>
                    {member.supervisor && (
                      <span className="text-[10px] text-muted-foreground">
                        Reports to {member.supervisor.firstName} {member.supervisor.lastName}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
