"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMatterSchema, CreateMatterInput } from "@/lib/validators/matter";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MatterForm() {
  const router = useRouter();
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["firm-members"],
    queryFn: () => apiFetch(`/api/firms/${user?.firmId}/members`),
    enabled: !!user?.firmId,
  });

  const form = useForm<CreateMatterInput>({
    resolver: zodResolver(createMatterSchema),
    defaultValues: {
      title: "",
      clientName: "",
      clientReference: "",
      court: "",
      caseNumber: "",
      judge: "",
      description: "",
      matterManagerId: "",
      matterPartnerId: "",
      clientPartnerId: "",
    },
  });

  const onSubmit = async (data: CreateMatterInput) => {
    setError(null);
    try {
      const payload = { ...data };
      if (!payload.matterManagerId) delete payload.matterManagerId;
      if (!payload.matterPartnerId) delete payload.matterPartnerId;
      if (!payload.clientPartnerId) delete payload.clientPartnerId;
      const matter = await apiFetch("/api/matters", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success(`Matter ${matter.reference} created`);
      router.push(`/matters/${matter.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New Matter</CardTitle>
        <CardDescription>
          Create a new legal matter. A reference number will be generated
          automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matter title</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith v Jones" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client reference (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="REF-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="court"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Central London County Court"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case number (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="CL-2026-000123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="judge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judge (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="HHJ Williams" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the matter..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Matter Team Roles */}
            <div className="space-y-1 pt-2">
              <p className="text-sm font-medium">Matter Team (optional)</p>
              <p className="text-xs text-muted-foreground">Assign team roles for key date escalation</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="matterManagerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matter Manager</FormLabel>
                    <Select value={field.value || ""} onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {members?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="matterPartnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matter Partner</FormLabel>
                    <Select value={field.value || ""} onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {members?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientPartnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Partner</FormLabel>
                    <Select value={field.value || ""} onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {members?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create matter"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
