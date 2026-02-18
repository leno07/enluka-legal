"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewBundlePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const router = useRouter();
  const { apiFetch } = useApi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const { data: documents } = useQuery({
    queryKey: ["documents", matterId],
    queryFn: () => apiFetch(`/api/matters/${matterId}/documents`),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/matters/${matterId}/bundles`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          documentIds: Array.from(selectedDocs).map((docId, index) => ({
            documentId: docId,
            section: "Main",
            position: index + 1,
          })),
        }),
      }),
    onSuccess: (bundle) => {
      toast.success("Bundle created");
      router.push(`/matters/${matterId}/bundles`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleDoc = (docId: string) => {
    const next = new Set(selectedDocs);
    if (next.has(docId)) next.delete(docId);
    else next.add(docId);
    setSelectedDocs(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Bundle</h1>
        <p className="text-muted-foreground">
          Select documents to compile into a court-compliant bundle
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Bundle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Trial Bundle"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bundle for trial hearing on..."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Select Documents</CardTitle>
          <CardDescription>
            Choose which documents to include in the bundle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents?.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedDocs.has(doc.id)}
                    onCheckedChange={() => toggleDoc(doc.id)}
                  />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{doc.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.category}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No documents available. Upload documents to this matter first.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => createMutation.mutate()}
          disabled={
            !title || selectedDocs.size === 0 || createMutation.isPending
          }
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            `Create Bundle (${selectedDocs.size} documents)`
          )}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
