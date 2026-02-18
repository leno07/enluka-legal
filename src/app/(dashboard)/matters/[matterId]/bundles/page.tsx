"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Plus } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATING: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function BundlesPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const { apiFetch } = useApi();

  const { data: bundles, isLoading } = useQuery({
    queryKey: ["bundles", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/bundles`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Court Bundles</h1>
          <p className="text-muted-foreground">
            Compile documents into court-compliant bundles
          </p>
        </div>
        <Link href={`/matters/${matterId}/bundles/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Bundle
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : bundles?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bundles.map((bundle: any) => (
            <Card key={bundle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{bundle.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={statusColors[bundle.status] || ""}
                  >
                    {bundle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                {bundle.description && <p>{bundle.description}</p>}
                <div className="flex items-center gap-4">
                  <span>{bundle._count.documents} document(s)</span>
                  {bundle.totalPages && <span>{bundle.totalPages} pages</span>}
                  {bundle._count.shareLinks > 0 && (
                    <span>{bundle._count.shareLinks} share link(s)</span>
                  )}
                </div>
                <div className="text-xs">
                  Created by {bundle.createdBy.firstName}{" "}
                  {bundle.createdBy.lastName} on{" "}
                  {format(new Date(bundle.createdAt), "d MMM yyyy")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No bundles yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a bundle to compile case documents into a court-compliant
              PDF.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
