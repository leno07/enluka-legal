"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, FileText, Target } from "lucide-react";

interface MatterCardProps {
  matter: {
    id: string;
    reference: string;
    title: string;
    clientName: string;
    court?: string | null;
    caseNumber?: string | null;
    status: string;
    owner: { firstName: string; lastName: string };
    _count: { directions: number; documents: number };
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  CLOSED: "bg-gray-100 text-gray-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

export function MatterCard({ matter }: MatterCardProps) {
  return (
    <Link href={`/matters/${matter.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">
                {matter.reference}
              </p>
              <CardTitle className="mt-1 text-lg">{matter.title}</CardTitle>
            </div>
            <Badge
              variant="secondary"
              className={statusColors[matter.status] || ""}
            >
              {matter.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{matter.clientName}</span>
            </div>
            {matter.court && (
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                <span>
                  {matter.court}
                  {matter.caseNumber ? ` (${matter.caseNumber})` : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-2">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {matter._count.directions} directions
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {matter._count.documents} documents
              </span>
            </div>
            <div className="text-xs">
              Owner: {matter.owner.firstName} {matter.owner.lastName}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
