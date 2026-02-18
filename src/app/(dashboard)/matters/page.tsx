"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { MatterCard } from "@/components/matters/matter-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";

export default function MattersPage() {
  const { apiFetch } = useApi();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["matters", search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      return apiFetch(`/api/matters?${params}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Matters</h1>
          <p className="text-muted-foreground text-sm">Manage your legal cases</p>
        </div>
        <Link href="/matters/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Matter
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search matters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : data?.data?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((matter: any) => (
            <MatterCard key={matter.id} matter={matter} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No matters yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first matter to start tracking court directions and
            deadlines.
          </p>
          <Link href="/matters/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Matter
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
